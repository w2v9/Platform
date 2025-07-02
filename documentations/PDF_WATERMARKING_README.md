# PDF Watermarking and Verification System

## Overview

This system implements invisible watermarking for PDF files downloaded from the AzoozGAT platform. It allows tracking of who downloaded specific PDFs and provides verification capabilities to check if a PDF originated from the platform.

## Features

### 1. PDF Download with Watermarking
- **Location**: `/dashboard/me/download`
- **Functionality**: 
  - Lists available PDFs from `src/data/pdf/` directory
  - Downloads PDFs with invisible watermarks containing user information
  - Logs all download activities

### 2. PDF Verification (Admin Only)
- **Location**: `/dashboard/verify-pdf`
- **Access**: Administrators only
- **Functionality**:
  - Upload any PDF to check if it contains platform watermarks
  - Displays download history and user information
  - Shows confidence level of verification
  - Administrative tool for tracking document distribution

## Technical Implementation

### Watermarking Process

When a user downloads a PDF:

1. **User Authentication**: System verifies user is logged in
2. **PDF Processing**: Original PDF is loaded using `pdf-lib`
3. **Watermark Insertion**: Multiple invisible watermarks are added:
   - Very small, transparent text on each page
   - Metadata in PDF properties
   - Keywords containing user ID and timestamp
4. **Logging**: Download activity is logged to `src/data/logs/pdf-downloads.jsonl`

### Watermark Data Structure

```json
{
  "userId": "user-firebase-uid",
  "userEmail": "user@example.com", 
  "userName": "User Display Name",
  "downloadTime": "2025-07-02T10:30:00.000Z",
  "filename": "document.pdf"
}
```

### Verification Process

1. **PDF Upload**: User uploads a PDF file
2. **Metadata Extraction**: System extracts PDF metadata and properties
3. **Watermark Detection**: Looks for platform-specific markers:
   - Creator: "AzoozGAT Platform"
   - Keywords containing user ID and timestamp
   - Subject line with user information
4. **Log Matching**: Matches extracted data with download logs
5. **Confidence Scoring**: Calculates verification confidence based on found evidence

## API Endpoints

### Download PDF with Watermark
- **Endpoint**: `POST /api/download/[filename]`
- **Purpose**: Download PDF with user-specific watermark
- **Body**: `{ userId, userEmail, userName }`
- **Response**: Base64 encoded watermarked PDF

### List Available PDFs
- **Endpoint**: `GET /api/pdfs`
- **Purpose**: Get list of available PDF files
- **Response**: Array of file information

### Verify PDF
- **Endpoint**: `POST /api/verify-pdf`
- **Purpose**: Verify if uploaded PDF contains platform watermarks
- **Body**: FormData with PDF file
- **Response**: Verification results with confidence score

## Security Features

1. **Invisible Watermarks**: Multiple layers of nearly transparent watermarks
2. **Metadata Embedding**: User information in PDF metadata
3. **Download Logging**: Complete audit trail of all downloads
4. **Verification System**: Ability to trace PDF origin and downloader

## File Structure

```
src/
├── app/
│   ├── (dashboard)/dashboard/me/
│   │   ├── download/page.tsx          # Download interface
│   │   └── verify-pdf/page.tsx        # Verification interface
│   └── api/
│       ├── download/[filename]/route.ts # Download API
│       ├── pdfs/route.ts               # List PDFs API
│       └── verify-pdf/route.ts         # Verification API
├── data/
│   ├── pdf/                           # Original PDF files
│   └── logs/
│       └── pdf-downloads.jsonl        # Download log file
```

## Usage Instructions

### For Users (Downloading PDFs)

1. Navigate to `/dashboard/me/download`
2. Browse available PDF files
3. Click "Download PDF" button
4. System automatically watermarks PDF with your user information
5. Download begins with watermarked file

### For Administrators (Verifying PDFs)

1. Navigate to `/dashboard/verify-pdf` (Admin access required)
2. Upload a PDF file you want to verify
3. Click "Verify PDF"
4. System shows:
   - Verification status (Verified/Likely Verified/Not Verified)
   - Confidence percentage
   - Download history if found
   - User information who downloaded it
   - Technical metadata details

## Log Format

Download logs are stored in JSONL format (one JSON object per line):

```json
{"userId":"abc123","userEmail":"user@example.com","userName":"John Doe","fileName":"document.pdf","downloadTime":"2025-07-02T10:30:00.000Z","ipAddress":"192.168.1.1","watermarkData":{...}}
```

## Security Considerations

- Watermarks are nearly invisible but detectable by the system
- Multiple redundant watermark locations prevent easy removal
- Download logs provide complete audit trail
- System can detect if watermarks have been tampered with
- IP addresses and timestamps provide additional tracking data

## Dependencies

- `pdf-lib`: PDF manipulation library
- `next.js`: Web framework
- `firebase`: User authentication
- `lucide-react`: Icons
- `tailwindcss`: Styling
