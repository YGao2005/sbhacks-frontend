// app/api/analyzepdf/route.ts
import { NextResponse } from 'next/server';

interface VisualizationData {
  x: string;
  y: number;
}

interface PythonResponse {
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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const pdfUrl = formData.get('pdfUrl') as string;

    if (!pdfUrl) {
      return NextResponse.json({ error: 'No PDF URL provided' }, { status: 400 });
    }

    console.log('Fetching PDF from:', pdfUrl);

    // Fetch the PDF with proper error handling
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'Accept': 'application/pdf,application/octet-stream',
      },
    });

    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }

    const pdfBlob = await pdfResponse.blob();
    
    if (pdfBlob.size === 0) {
      throw new Error('Retrieved PDF is empty');
    }

    console.log('PDF blob size:', pdfBlob.size);

    const formDataForPython = new FormData();
    const uniqueFilename = `document_${Date.now()}.pdf`;
    formDataForPython.append('pdf', pdfBlob, uniqueFilename);

    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        const response = await fetch('http://127.0.0.1:5000/upload_pdf_get_sum_graph', {
          method: 'POST',
          body: formDataForPython,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Python API error: ${errorText}`);
        }

        const pythonResponse: PythonResponse = await response.json();

        // Validate the response structure
        if (pythonResponse.status !== 'success' || !pythonResponse.data?.summary || !pythonResponse.data?.visualization) {
          throw new Error('Invalid response structure from Python API');
        }

        // Return the response in the expected format
        return NextResponse.json({
          status: pythonResponse.status,
          message: pythonResponse.message,
          data: {
            summary: pythonResponse.data.summary,
            visualization: {
              data: pythonResponse.data.visualization.data,
              image: pythonResponse.data.visualization.image
            }
          }
        });

      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`Retrying... ${retries} attempts remaining`);
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Failed to process PDF after all retries');

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to analyze PDF',
        error: {
          details: error instanceof Error ? error.stack : undefined
        }
      },
      { status: 500 }
    );
  }
}