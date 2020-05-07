$('#uploadFile').on('change',function(){
    //get the file name
    var fileName = $(this).val();
    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(fileName);
});

function upload_action(){
    if ($('#uploadFile').val()==""){
        alert("Choose a file");
        return;
    }

    $("#uploadModalCenter").show();

    $.ajax({
        url: "uploadFile/",
        type: "POST",
        data: new FormData($('#uploadForm')[0]),
        processData: false,
        contentType: false,
    }).done(function(response){
        if ('error' in response){
            alert(response['error']);
        }else{
            var url = "editor/?id=" + response['id'] + "&filename=" + response['filename'];
            window.location.replace(url);
        }
    }).fail(function(){
        alert("Error while uploading the file");
    });

    $("#uploadModalCenter").hide();
}
