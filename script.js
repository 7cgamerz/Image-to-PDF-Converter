const fileInput = document.getElementById('file-input');
        const selectedFile = document.getElementById('selected-file');
        const fileCount = document.getElementById('file-count');
        const formatSelect = document.getElementById('format-select');
        const orientationSelect = document.getElementById('orientation-select');
        const marginInput = document.getElementById('margin-input');
        const convertBtn = document.getElementById('convert-btn');
        const downloadBtn = document.getElementById('download-btn');
        const resetBtn = document.getElementById('reset-btn');
        const imagePreviews = document.getElementById('image-previews');
        const emptyState = document.getElementById('empty-state');
        const status = document.getElementById('status');
        const statusText = document.getElementById('status-text');
        const dropZone = document.getElementById('drop-zone');
        const progressBar = document.getElementById('progress-bar');
        const progressContainer = document.querySelector('.progress-bar');
        
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        
        // State variables
        let uploadedImages = [];
        let pdfData = null;
        
        // Event listeners
        fileInput.addEventListener('change', handleFileSelect);
        convertBtn.addEventListener('click', convertToPdf);
        downloadBtn.addEventListener('click', downloadPdf);
        resetBtn.addEventListener('click', resetAll);
        
        // Drag and drop functionality
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: fileInput });
            }
        });
        
        // Click on drop zone to open file dialog
        dropZone.addEventListener('click', (e) => {
            if (e.target === dropZone || !e.target.closest('label')) {
                fileInput.click();
            }
        });
        
        // Functions
        function handleFileSelect(event) {
            const files = event.target.files;
            
            if (files.length === 0) return;
            
            // Update selected file text
            fileCount.textContent = `${files.length} file${files.length > 1 ? 's' : ''} selected`;
            
            // Show progress bar
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            
            // Process each file
            let processed = 0;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Check if file is an image
                if (!file.type.match('image.*')) {
                    statusText.textContent = `Skipped ${file.name}: Not an image file`;
                    processed++;
                    updateProgress(processed, files.length);
                    continue;
                }
                
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const imageData = {
                        name: file.name,
                        dataUrl: e.target.result,
                        element: null
                    };
                    
                    uploadedImages.push(imageData);
                    processed++;
                    updateProgress(processed, files.length);
                    
                    if (processed === files.length) {
                        setTimeout(() => {
                            renderImagePreviews();
                            progressContainer.style.display = 'none';
                            
                            // Enable convert button if we have at least one image
                            if (uploadedImages.length > 0) {
                                convertBtn.disabled = false;
                                emptyState.style.display = 'none';
                                statusText.textContent = `Added ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}. Click 'Convert to PDF' to continue.`;
                            }
                        }, 500);
                    }
                };
                
                reader.readAsDataURL(file);
            }
        }
        
        function updateProgress(processed, total) {
            const percent = (processed / total) * 100;
            progressBar.style.width = `${percent}%`;
        }
        
        function renderImagePreviews() {
            // Clear existing previews (except empty state)
            Array.from(imagePreviews.children).forEach(child => {
                if (child.id !== 'empty-state') {
                    child.remove();
                }
            });
            
            // Add image previews
            uploadedImages.forEach((image, index) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                
                const img = document.createElement('img');
                img.src = image.dataUrl;
                img.alt = image.name;
                
                const imageName = document.createElement('div');
                imageName.className = 'image-name';
                imageName.textContent = image.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeImage(index);
                });
                
                imageItem.appendChild(img);
                imageItem.appendChild(imageName);
                imageItem.appendChild(removeBtn);
                
                imagePreviews.appendChild(imageItem);
            });
        }
        
        function removeImage(index) {
            uploadedImages.splice(index, 1);
            renderImagePreviews();
            
            if (uploadedImages.length === 0) {
                convertBtn.disabled = true;
                emptyState.style.display = 'block';
                fileCount.textContent = 'No files selected';
                statusText.textContent = 'Ready to convert. Select images to begin.';
            } else {
                fileCount.textContent = `${uploadedImages.length} file${uploadedImages.length > 1 ? 's' : ''} selected`;
                statusText.textContent = `Removed image. ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} remaining.`;
            }
        }
        
        function convertToPdf() {
            if (uploadedImages.length === 0) {
                statusText.textContent = 'Please upload at least one image first.';
                return;
            }
            
            statusText.textContent = 'Converting images to PDF...';
            convertBtn.disabled = true;
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            
            // Get PDF settings
            const format = formatSelect.value;
            const orientation = orientationSelect.value;
            const margin = parseInt(marginInput.value);
            
            // Create new PDF document
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: format
            });
            
            // Process images sequentially
            let currentImage = 0;
            
            function processNextImage() {
                if (currentImage >= uploadedImages.length) {
                    // All images processed
                    pdfData = pdf.output('datauristring');
                    progressBar.style.width = '100%';
                    
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                        statusText.textContent = `Conversion complete! PDF contains ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}.`;
                        convertBtn.disabled = false;
                        downloadBtn.disabled = false;
                    }, 500);
                    
                    return;
                }
                
                const percent = (currentImage / uploadedImages.length) * 100;
                progressBar.style.width = `${percent}%`;
                statusText.textContent = `Processing image ${currentImage + 1} of ${uploadedImages.length}...`;
                
                const img = new Image();
                img.src = uploadedImages[currentImage].dataUrl;
                
                img.onload = function() {
                    // Calculate dimensions to fit within page with margins
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    
                    const contentWidth = pageWidth - (margin * 2);
                    const contentHeight = pageHeight - (margin * 2);
                    
                    let imgWidth = img.width;
                    let imgHeight = img.height;
                    
                    // Scale image to fit page
                    const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
                    imgWidth *= ratio;
                    imgHeight *= ratio;
                    
                    // Calculate centering position
                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;
                    
                    // Add image to PDF
                    pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight, `image${currentImage}`, 'MEDIUM');
                    
                    // Add new page if there are more images
                    if (currentImage < uploadedImages.length - 1) {
                        pdf.addPage();
                    }
                    
                    currentImage++;
                    setTimeout(processNextImage, 100);
                };
            }
            
            processNextImage();
        }
        
        function downloadPdf() {
            if (!pdfData) {
                statusText.textContent = 'Please convert images to PDF first.';
                return;
            }
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = pdfData;
            downloadLink.download = 'converted-images.pdf';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            statusText.textContent = 'PDF downloaded successfully!';
        }
        
        function resetAll() {
            // Reset everything
            fileInput.value = '';
            uploadedImages = [];
            pdfData = null;
            fileCount.textContent = 'No files selected';
            statusText.textContent = 'Ready to convert. Select images to begin.';
            convertBtn.disabled = true;
            downloadBtn.disabled = true;
            progressContainer.style.display = 'none';
            
            // Clear previews and show empty state
            Array.from(imagePreviews.children).forEach(child => {
                if (child.id !== 'empty-state') {
                    child.remove();
                }
            });
            
            emptyState.style.display = 'block';
        }
