// app/api/upload-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'
import FormData from 'form-data'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pdfUrl } = body

    if (!pdfUrl) {
      return NextResponse.json(
        { message: 'PDF URL is required' },
        { status: 400 }
      )
    }

    // Fetch the PDF from the provided URL
    const pdfResponse = await fetch(pdfUrl)
    const pdfBuffer = await pdfResponse.buffer()

    // Create a FormData instance
    const formData = new FormData()
    formData.append('pdf', pdfBuffer, {
      filename: 'document.pdf',
      contentType: 'application/pdf',
    })

    // Send the PDF to the Flask endpoint
    const flaskResponse = await fetch('http://127.0.0.1:5000/upload_pdf', {
      method: 'POST',
      body: formData,
    })

    if (!flaskResponse.ok) {
      throw new Error(`Flask API responded with status: ${flaskResponse.status}`)
    }

    const flaskData = await flaskResponse.json()
    return NextResponse.json(flaskData)

  } catch (error) {
    console.error('Error uploading PDF:', error)
    return NextResponse.json(
      { 
        message: 'Error uploading PDF',
        error: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// Optional: Add size limit configuration
export const runtime = 'nodejs' // optional
export const dynamic = 'force-dynamic'