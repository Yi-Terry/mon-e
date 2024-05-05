function scanReceipt() {
  
}

document.addEventListener('DOMContentLoaded', function () {
  const uploadReceiptBtn = document.getElementById('uploadReceiptBtn')
  if (uploadReceiptBtn) {
    uploadReceiptBtn.addEventListener('click', function () {
      const file = document.getElementById('receiptFileInput').files[0]
      if (file) {
        console.log('File uploaded:', file)
        $('#receiptScannerModal').modal('hide')
      } else {
        alert('Please select a file.')
      }
    })
  }
})
