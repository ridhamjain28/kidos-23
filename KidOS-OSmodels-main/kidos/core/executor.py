from typing import Any, Dict
from kidos.agents.base import BaseAgent, AgentResult

from kidos.agents.image_director import ImageDirectorAgent
from kidos.agents.research_agent import ResearchAgent
from kidos.agents.content_writer import ContentWriterAgent
from kidos.agents.workflow_planner import WorkflowPlannerAgent

from kidos.tools.ollama_tool import OllamaTool
from kidos.tools.comfyui_tool import ComfyUITool
from kidos.tools.tts_tool import TTSTool
from kidos.core.task_router import TaskRouter
from kidos.core.logger import get_logger
from kidos.memory.memory_engine import memory_engine

# Import Behavioral Services
from app.services.behavior_engine import behavior_engine
from app.services.kernel import kernel_manager

logger = get_logger("kidos.core.executor")


class Executor(BaseAgent):
    """KidOS Core: Process Execution Engine (The Kernel)

    Now with vector memory — every interaction is stored and
    relevant past context is injected into LLM prompts.
    """

    name = "kidos_kernel"
    description = "KidOS Process Orchestrator: receives instructions, schedules them, and executes sub-agents"

    def __init__(
        self,
        ollama: OllamaTool | None = None,
        comfyui: ComfyUITool | None = None,
        tts: TTSTool | None = None,
    ):
        super().__init__(ollama=ollama, comfyui=comfyui, tts=tts)
        self.router = TaskRouter(self.ollama)
        self.memory = memory_engine

        # OS Subprocess Agents registered dynamically
        self.processes: Dict[str, BaseAgent] = {}
        self._bootstrap_os_processes()

    def _bootstrap_os_processes(self) -> None:
        """Mount the core OS sub-agents into memory."""
        logger.info("Bootstrapping KidOS core sub-agents into memory...")
        self.register_process("image", ImageDirectorAgent(ollama=self.ollama, comfyui=self.comfyui, tts=self.tts))
        self.register_process("plan", WorkflowPlannerAgent(ollama=self.ollama, comfyui=self.comfyui, tts=self.tts))
        self.register_process("research", ResearchAgent(ollama=self.ollama, comfyui=self.comfyui, tts=self.tts))
        self.register_process("content", ContentWriterAgent(ollama=self.ollama, comfyui=self.comfyui, tts=self.tts))

    def register_process(self, process_id: str, agent_instance: BaseAgent) -> None:
        """Mount a new specialist agent into the KidOS Process Table."""
        self.processes[process_id] = agent_instance
        logger.info(f"Mounted sub-system process: [{process_id}]")

    @property
    def system_prompt(self) -> str:
        return (
            "You are KidOS, a sophisticated, highly helpful OS-level AI assistant. "
            "You manage background processes and help the user efficiently navigate their requests. "
            "Answer the user's question directly, clearly, and concisely as the core operating system persona."
        )

    async def _build_memory_context(self, user_message: str) -> str:
        """Search vector memory for relevant past interactions."""
        try:
            context = await self.memory.recall(user_message, n=3)
            if context:
                logger.info(f"> Memory recall returned context ({len(context)} chars)")
            return context
        except Exception as e:
            logger.info(f"> Memory recall skipped (embedding service unavailable): {e}")
            return ""

    async def _store_interaction(self, user_message: str, response: str, agent: str) -> None:
        """Store the current interaction in vector memory."""
        try:
            memory_text = f"User: {user_message}\nAssistant ({agent}): {response[:300]}"
            await self.memory.remember(memory_text, source=agent)
        except Exception as e:
            logger.info(f"> Memory store skipped (embedding service unavailable): {e}")

    async def run(self, user_message: str, user_id: str = "default_child", **kwargs: Any) -> AgentResult:
        """Executes the OS lifecycle for a given user command."""
        logger.info(f"> KidOS Execution Triggered for user [{user_id}]: '{user_message[:60]}...'")

        # 0. Behavioral Analysis (New Step)
        mode = await behavior_engine.get_user_mode(user_id)
        curiosity = await behavior_engine.get_curiosity_type(user_id)
        
        behavioral_modifier = ""
        if mode == "low_complexity":
            behavioral_modifier = "\n[SYSTEM NOTE: User is showing signs of frustration. Explain simply in 2 lines.]"
            logger.info(f"> Behavior Engine: Triggering LOW_COMPLEXITY mode for {user_id}")
        
        if curiosity != "UNKNOWN":
            behavioral_modifier += f"\n[SYSTEM NOTE: User curiosity type is {curiosity}. Tailor your explanation to this style.]"

        # 1. Memory Recall — Fetch relevant past context
        memory_context = await self._build_memory_context(user_message)

        # 2. OS Routing (Find the right worker process)
        intent = await self.router.classify(user_message)

        # 3. Process Delegation (Hand off to specialist/daemon)
        if intent in self.processes:
            logger.info(f"> Delegating PID to specialist process daemon: [{intent}]")

            # Enrich message with behavioral modifiers and memory
            final_message = user_message
            if memory_context:
                final_message += f"\n\n[Relevant context from KidOS memory]:\n{memory_context}"
            if behavioral_modifier:
                final_message += f"\n{behavioral_modifier}"

            result = await self.processes[intent].run(final_message, **kwargs)

            # Store the interaction in memory
            await self._store_interaction(user_message, result.content, result.agent_name)
            return result

        # 4. Process Execution (Handle locally if general chat)
        logger.info("> Self-executing general interaction within the kernel.")

        # Inject memory context and behavioral modifiers into the prompt
        final_prompt = user_message
        if memory_context:
            final_prompt += f"\n\n[Relevant context from KidOS memory]:\n{memory_context}"
        if behavioral_modifier:
            final_prompt += f"\n{behavioral_modifier}"
            
        response = await self.think(final_prompt)

        # Store the interaction
        await self._store_interaction(user_message, response, self.name)

        return AgentResult(
            type="text",
            content=response,
            agent_name=self.name,
        )
