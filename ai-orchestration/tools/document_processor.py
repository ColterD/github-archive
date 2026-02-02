#!/usr/bin/env python3
"""
Document Processing Pipeline
Created: November 13, 2025
Purpose: Extract knowledge from PDFs/documents and store in Mimir
Uses: PyMuPDF (free) + Ollama (local LLM) + Mimir storage
"""

import sys
import json
import os
from pathlib import Path
from typing import List, Dict, Any
import subprocess
import argparse
from datetime import datetime

try:
    import pymupdf  # PyMuPDF
except ImportError:
    print("Installing PyMuPDF...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"])
    import pymupdf

class DocumentProcessor:
    def __init__(self, ollama_model: str = "llama3.2:3b", mimir_url: str = "http://localhost:9042/mcp"):
        self.ollama_model = ollama_model
        self.mimir_url = mimir_url
        self.processed_count = 0
        self.failed_count = 0
        
    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """Extract text from PDF using PyMuPDF."""
        try:
            doc = pymupdf.open(str(pdf_path))
            text_parts = []
            
            for page_num, page in enumerate(doc, 1):
                text = page.get_text()
                if text.strip():
                    text_parts.append(f"--- Page {page_num} ---\n{text}")
            
            doc.close()
            return "\n\n".join(text_parts)
        except Exception as e:
            print(f"✗ Failed to extract text from {pdf_path}: {e}")
            return ""
    
    def chunk_text(self, text: str, chunk_size: int = 4000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks for processing."""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap  # Overlap to maintain context
        
        return chunks
    
    def process_with_ollama(self, text: str, doc_name: str) -> Dict[str, Any]:
        """Process document chunk with local Ollama LLM."""
        prompt = f"""Extract and summarize the key information from this document: {doc_name}

Document content:
{text[:4000]}

Please provide:
1. A concise summary (2-3 sentences)
2. Main topics covered
3. Key facts or data points
4. Any actionable information

Format your response as structured information."""

        try:
            # Call Ollama directly
            result = subprocess.run(
                ["ollama", "run", self.ollama_model, prompt],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                return {
                    "summary": result.stdout.strip(),
                    "success": True
                }
            else:
                return {
                    "summary": text[:500] + "..." if len(text) > 500 else text,
                    "success": False,
                    "error": result.stderr
                }
        except subprocess.TimeoutExpired:
            return {
                "summary": text[:500] + "...",
                "success": False,
                "error": "Ollama timeout"
            }
        except Exception as e:
            return {
                "summary": text[:500] + "...",
                "success": False,
                "error": str(e)
            }
    
    def store_in_mimir(self, title: str, content: str, tags: List[str], metadata: Dict[str, Any]) -> bool:
        """Store processed document in Mimir."""
        try:
            # Prepare MCP request
            mcp_request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "mcp_mimir_memory_node",
                    "arguments": {
                        "operation": "add",
                        "type": "memory",
                        "properties": {
                            "title": title,
                            "content": content,
                            "category": "documents",
                            "tags": tags,
                            "source_file": metadata.get("source_file", ""),
                            "processed_date": datetime.now().isoformat(),
                            "page_count": metadata.get("page_count", 0),
                            "file_size": metadata.get("file_size", 0),
                            "processing_method": "document_processor"
                        }
                    }
                }
            }
            
            # Use curl to call Mimir MCP
            result = subprocess.run(
                ["curl", "-s", "-X", "POST", self.mimir_url,
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps(mcp_request)],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                response = json.loads(result.stdout)
                if "result" in response:
                    print(f"✓ Stored in Mimir: {title}")
                    return True
            
            print(f"⚠ Failed to store in Mimir: {result.stderr}")
            return False
            
        except Exception as e:
            print(f"✗ Error storing in Mimir: {e}")
            return False
    
    def process_pdf(self, pdf_path: Path) -> bool:
        """Process a single PDF file."""
        print(f"\n📄 Processing: {pdf_path.name}")
        
        # Extract text
        print("  Extracting text...")
        text = self.extract_text_from_pdf(pdf_path)
        
        if not text:
            print("  ✗ No text extracted")
            self.failed_count += 1
            return False
        
        text_length = len(text)
        word_count = len(text.split())
        print(f"  Extracted {word_count} words ({text_length} characters)")
        
        # Process with Ollama
        print(f"  Processing with {self.ollama_model}...")
        chunks = self.chunk_text(text)
        
        summaries = []
        for i, chunk in enumerate(chunks, 1):
            if len(chunks) > 1:
                print(f"    Processing chunk {i}/{len(chunks)}...")
            
            result = self.process_with_ollama(chunk, pdf_path.name)
            if result["success"]:
                summaries.append(result["summary"])
            else:
                print(f"    ⚠ Chunk {i} processing failed: {result.get('error', 'Unknown')}")
                summaries.append(f"[Chunk {i} - Raw text]\n{chunk[:500]}...")
        
        # Combine summaries
        if len(summaries) > 1:
            combined_content = f"# Document: {pdf_path.name}\n\n"
            combined_content += f"**Processed in {len(summaries)} parts**\n\n"
            for i, summary in enumerate(summaries, 1):
                combined_content += f"## Part {i}\n{summary}\n\n"
        else:
            combined_content = f"# Document: {pdf_path.name}\n\n{summaries[0]}"
        
        # Store in Mimir
        print("  Storing in Mimir...")
        metadata = {
            "source_file": str(pdf_path),
            "page_count": text.count("--- Page"),
            "file_size": pdf_path.stat().st_size
        }
        
        tags = ["document", "pdf", "processed", pdf_path.stem.lower()]
        
        success = self.store_in_mimir(
            title=f"Document: {pdf_path.name}",
            content=combined_content,
            tags=tags,
            metadata=metadata
        )
        
        if success:
            self.processed_count += 1
            print(f"  ✓ Successfully processed and stored")
            return True
        else:
            self.failed_count += 1
            print(f"  ✗ Failed to store")
            return False
    
    def process_directory(self, dir_path: Path, recursive: bool = True) -> None:
        """Process all PDFs in a directory."""
        pattern = "**/*.pdf" if recursive else "*.pdf"
        pdf_files = list(dir_path.glob(pattern))
        
        if not pdf_files:
            print(f"No PDF files found in {dir_path}")
            return
        
        print(f"\nFound {len(pdf_files)} PDF file(s) to process")
        
        for pdf_file in pdf_files:
            self.process_pdf(pdf_file)
        
        self.print_summary()
    
    def print_summary(self) -> None:
        """Print processing summary."""
        total = self.processed_count + self.failed_count
        print(f"\n{'='*60}")
        print("DOCUMENT PROCESSING SUMMARY")
        print(f"{'='*60}")
        print(f"Total documents: {total}")
        print(f"✓ Successfully processed: {self.processed_count}")
        print(f"✗ Failed: {self.failed_count}")
        print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description="Process documents and store in Mimir")
    parser.add_argument("path", help="Path to PDF file or directory")
    parser.add_argument("--model", default="llama3.2:3b", help="Ollama model to use")
    parser.add_argument("--recursive", action="store_true", default=True, help="Process subdirectories")
    
    args = parser.parse_args()
    
    path = Path(args.path)
    
    if not path.exists():
        print(f"✗ Path does not exist: {path}")
        sys.exit(1)
    
    # Check if Ollama is available
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, timeout=5)
        if result.returncode != 0:
            print("✗ Ollama is not running. Start it with: ollama serve")
            sys.exit(1)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("✗ Ollama is not installed or not in PATH")
        print("  Install: https://ollama.ai/")
        sys.exit(1)
    
    # Check if model is available
    try:
        result = subprocess.run(
            ["ollama", "show", args.model],
            capture_output=True,
            timeout=5
        )
        if result.returncode != 0:
            print(f"⚠ Model {args.model} not found. Pulling...")
            subprocess.run(["ollama", "pull", args.model], check=True)
    except subprocess.TimeoutExpired:
        print(f"⚠ Could not verify model {args.model}, proceeding anyway...")
    
    processor = DocumentProcessor(ollama_model=args.model)
    
    if path.is_file():
        if path.suffix.lower() == '.pdf':
            processor.process_pdf(path)
            processor.print_summary()
        else:
            print(f"✗ Not a PDF file: {path}")
            sys.exit(1)
    elif path.is_dir():
        processor.process_directory(path, recursive=args.recursive)
    else:
        print(f"✗ Invalid path: {path}")
        sys.exit(1)

if __name__ == "__main__":
    main()
