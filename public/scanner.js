function fileUpload() {
  const fileInput = document.getElementById('receiptFileInput')
  const file = fileInput.files[0]

  if (file) {
    const formData = new FormData()
    formData.append('file', file)

    fetch('/fileupload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json()) 
      .then((data) => {
        if (data.message === 'File uploaded successfully') {
          console.log('File uploaded successfully. Filename:', data.filename)
          $('#receiptScannerModal').modal('hide')
        } else {
          console.error('Failed to upload file:', data.message)
        }
      })
      .catch((error) => {
        console.error('Error uploading file:', error)
      })
  } else {
    alert('Please select a file.')
  }
}


document.addEventListener('DOMContentLoaded', function () {
  const uploadReceiptBtn = document.getElementById('uploadReceiptBtn')
  if (uploadReceiptBtn) {
    uploadReceiptBtn.addEventListener('click', fileUpload)
  }
})
