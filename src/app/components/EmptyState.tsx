// components/EmptyState.tsx
export const EmptyState = ({ onSampleSearch }: { onSampleSearch: (query: string) => void }) => {
    const sampleQueries = [
      "machine learning",
      "quantum computing",
      "artificial intelligence",
      "climate change",
    ];
  
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Start Your Research Journey</h2>
          <p className="text-gray-600 mb-8">
            Search for academic papers, articles, and research across various fields.
            Try these popular topics:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {sampleQueries.map((query) => (
              <button
                key={query}
                onClick={() => onSampleSearch(query)}
                className="px-4 py-2 rounded-full bg-white border border-blue-200 hover:border-blue-400 
                           text-blue-600 text-sm transition-colors duration-200"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };