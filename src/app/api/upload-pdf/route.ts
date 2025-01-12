// app/api/upload-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'
import FormData from 'form-data'
import puppeteer from 'puppeteer'

async function isPDF(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return contentType?.includes('application/pdf') || false
  } catch (error) {
    return false
  }
}

async function convertWebPageToPDF(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
  })
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    })
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pdfUrl } = body

    if (!pdfUrl) {
      return NextResponse.json(
        { message: 'URL is required' },
        { status: 400 }
      )
    }

    let pdfBuffer: Buffer
    
    // Check if the URL is already a PDF
    if (await isPDF(pdfUrl)) {
      // Fetch the PDF directly
      const pdfResponse = await fetch(pdfUrl)
      pdfBuffer = await pdfResponse.buffer()
    } else {
      // Convert webpage to PDF
      pdfBuffer = await convertWebPageToPDF(pdfUrl)
    }

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
    console.error('Error processing document:', error)
    return NextResponse.json(
      { 
        message: 'Error processing document',
        error: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'