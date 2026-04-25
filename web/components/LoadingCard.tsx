export default function LoadingCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full shimmer" />
          <div className="flex-1">
            <div className="h-3 w-20 rounded-full shimmer mb-2" />
            <div className="h-5 w-32 rounded-full shimmer" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full shimmer" />
          <div className="h-3 w-5/6 rounded-full shimmer" />
          <div className="h-3 w-4/6 rounded-full shimmer" />
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="h-10 rounded-2xl shimmer mt-3" />
      </div>
    </div>
  );
}
