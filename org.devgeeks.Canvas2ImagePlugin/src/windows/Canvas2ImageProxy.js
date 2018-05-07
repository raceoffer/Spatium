function convertFromBase64String(base64) {
    const raw = window.atob(base64)
    let array = new Uint8Array(new ArrayBuffer(raw.length))
    
    for(let i = 0; i < raw.length; i++) {
        array[i] = raw.charCodeAt(i)
    }
    return array;
}

function formatDate(date) {
    const d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    let year = d.getFullYear()
    let hours = '' + d.getHours()
    let minutes = '' + d.getMinutes()
    let seconds = '' + d.getSeconds()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day
    if (hours.length < 2) hours = '0' + hours
    if (minutes.length < 2) minutes = '0' + minutes
    if (seconds.length < 2) seconds = '0' + seconds
    
    const result = `${[year, month, day].join('-')}_${[hours, minutes, seconds].join('-')}`
    return result;
}

cordova.commandProxy.add("Canvas2ImagePlugin", {
    saveImageDataToLibrary: function (successCallback, errorCallback, params) {
        var asArray = convertFromBase64String(params[0]);
        var blob = new Blob( [ asArray.buffer ], {type: "image/png"} )
        const fileName =  `c2i_${formatDate(new Date())}.png`
        
        Windows.Storage.KnownFolders.picturesLibrary.createFileAsync(fileName, 
            Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (file) { 
            // Open the returned file in order to copy the data 
            file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (output) { 
                // Get the IInputStream stream from the blob object 
                var input = blob.msDetachStream()
                // Copy the stream from the blob to the File stream 
                Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output).then(function () { 
                    output.flushAsync().done(function () { 
                        input.close()
                        output.close()
                        successCallback("Image saved: " + fileName)
                    }, function (error) {errorCallback("Filed to write file: " + fileName)})
                }, function(error) {errorCallback("Failed to save image: " + fileName)})
            }, function (error) {errorCallback("Failed to open file: " + fileName)})
        }, function (error) {errorCallback("Failed to create file: " + fileName)})

    }
})