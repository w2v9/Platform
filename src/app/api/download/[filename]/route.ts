import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        const body = await request.json();

        // Get user data from request body
        const { userId, userEmail, userName } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);

        // Check if filename ends with .pdf
        if (!sanitizedFilename.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Construct the file path
        const filePath = path.join(process.cwd(), 'src', 'data', 'pdf', sanitizedFilename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Read the original PDF file
        const originalPdfBytes = fs.readFileSync(filePath);

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(originalPdfBytes);

        // Add invisible watermark with user data
        const watermarkData = {
            userId: userId,
            userEmail: userEmail || 'unknown',
            userName: userName || 'unknown',
            downloadTime: new Date().toISOString(),
            filename: sanitizedFilename
        };

        // Create invisible watermark text
        const watermarkText = JSON.stringify(watermarkData);

        // Get all pages
        const pages = pdfDoc.getPages();

        // Add invisible watermark to each page
        for (const page of pages) {
            const { width, height } = page.getSize();

            // Add invisible text (very small, transparent)
            page.drawText(watermarkText, {
                x: width - 100,
                y: 10,
                size: 0.1, // Very small font size
                color: rgb(1, 1, 1), // White color (invisible on white background)
                opacity: 0.01, // Nearly transparent
            });

            // Add another invisible copy in metadata area
            page.drawText(watermarkText, {
                x: 5,
                y: height - 10,
                size: 0.1,
                color: rgb(1, 1, 1),
                opacity: 0.01,
            });

            // Add watermark in the middle (barely visible)
            page.drawText(watermarkText, {
                x: width / 2 - 50,
                y: height / 2,
                size: 0.1,
                color: rgb(1, 1, 1),
                opacity: 0.005,
            });
        }

        // Add metadata to PDF
        pdfDoc.setTitle(sanitizedFilename);
        pdfDoc.setSubject(`Downloaded by ${userName || userEmail}`);
        pdfDoc.setKeywords([userId, new Date().toISOString()]);
        pdfDoc.setCreator('AzoozGAT Platform');

        // Serialize the PDF
        const watermarkedPdfBytes = await pdfDoc.save();

        // Log the download for tracking
        console.log('PDF Downloaded:', {
            userId,
            userEmail,
            userName,
            fileName: sanitizedFilename,
            downloadTime: new Date().toISOString(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        // Store download log in a simple JSON file for verification purposes
        const logEntry = {
            userId,
            userEmail,
            userName,
            fileName: sanitizedFilename,
            downloadTime: new Date().toISOString(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            watermarkData
        };

        // Create logs directory if it doesn't exist
        const logsDir = path.join(process.cwd(), 'src', 'data', 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Append to download log file
        const logFilePath = path.join(logsDir, 'pdf-downloads.jsonl');
        fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');

        // Return the watermarked PDF as base64
        const base64Pdf = Buffer.from(watermarkedPdfBytes).toString('base64');

        return NextResponse.json({
            success: true,
            pdf: base64Pdf,
            filename: sanitizedFilename
        });

    } catch (error) {
        console.error('Error processing PDF download:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
