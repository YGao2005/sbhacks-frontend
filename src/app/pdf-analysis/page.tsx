'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface VisualizationData {
  x: string;
  y: number;
}

interface AnalysisResponse {
  status: string;
  message: string;
  data: {
    summary: string;
    visualization: {
      data: {
        visualization_type: string;
        title: string;
        data: VisualizationData[];
        axes: {
          x_label: string;
          y_label: string;
        };
      };
      image: string;
    };
  };
}

export default function PdfAnalysisPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const pdfUrl = searchParams.get('url')

  useEffect(() => {
    if (pdfUrl) {
      analyzePdf(pdfUrl)
    }
  }, [pdfUrl])

  const analyzePdf = async (url: string) => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('pdfUrl', url)
      console.log('Analyzing PDF:', url)

      const res = await fetch('/api/analyzepdf', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to analyze PDF')
      }

      const data: AnalysisResponse = await res.json()
      if (data.status !== 'success' || !data.data?.summary || !data.data?.visualization) {
        throw new Error('Invalid response format from server')
      }
      setAnalysis(data)
    } catch (error) {
      console.error('Failed to analyze PDF:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {analysis && (
          <>
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <p className="text-gray-700">{analysis.data.summary}</p>
            </div>

            {analysis.data.visualization && (
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {analysis.data.visualization.data.title || 'Analysis Visualization'}
                </h2>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Visualization Type: {analysis.data.visualization.data.visualization_type}
                  </p>
                  <p className="text-sm text-gray-500">
                    X-Axis: {analysis.data.visualization.data.axes.x_label}
                  </p>
                  <p className="text-sm text-gray-500">
                    Y-Axis: {analysis.data.visualization.data.axes.y_label}
                  </p>
                </div>
                <img 
                  src={`data:image/png;base64,${analysis.data.visualization.image}`} 
                  alt={analysis.data.visualization.data.title || 'Analysis Visualization'} 
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error('Failed to load image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Data table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">{analysis.data.visualization.data.axes.x_label}</th>
                        <th className="px-4 py-2">{analysis.data.visualization.data.axes.y_label}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.data.visualization.data.data.map((item, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2">{item.x}</td>
                          <td className="border px-4 py-2">{item.y}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button
              onClick={() => {/* Handle save to collection */}}
              className="w-full max-w-md mx-auto block"
            >
              Save to Collection
            </Button>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  )
}