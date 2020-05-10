var load_pdf_list = [];
$( document ).ready(async function() {

    await $.ajax({
        url: "/get_stored_document",
        async: false,
        success: function(response){
            if('error' in response){
                alert(response['error']);
            }else{
                var document_data = response['document_data'];
                for(var x=0;x<document_data.length;x++){
                    var html = `
                        <div class="col-md-1.5 mt-4 mr-5 btn"
                            onclick="javascript:window.location.href='./editor/?id=${document_data[x]._id}&filename=${document_data[x].pdf_name}'">
                            <div class="card">
                                <canvas id="${document_data[x]._id}" width="120"></canvas>
                            </div>
                            <div class="card-footer pt-0">
                                <small class="text-muted pt-0 pb-0" style="max-width: 120px;">
                                  ${document_data[x]['pdf_name']}
                                </small><br>
                                <small class="text-muted pt-0 pb-0" style="max-width: 120px;">
                                  ${document_data[x]['created_datetime']}
                                </small>
                            </div>

                        </div>
                    `;
                    load_pdf_list.push(document_data[x]._id);
                    $("#stored_documents").append(html);
                }
            }
        }
    });

    pdfjsLib.GlobalWorkerOptions.workerSrc = "../static/pdf.worker.js";

    for(var index=0;index<load_pdf_list.length;index++){
        $.ajax({
            url: "/getImage",
            type: "GET",
            async: false,
            data: {'fileID' : load_pdf_list[index]},
            success: function(response){
                if('error' in response){
                    alert(response['error']);
                }else{
                    pdfjsLib.getDocument({data: atob(response['fileData']), }).then(function(pdf){
                        pdf.getPage(1).then(function(page) {
                            var scale = 1;
                            var viewport = page.getViewport({ scale: scale, });
                            var canvas = document.getElementById(response["_id"]);
                            var context = canvas.getContext('2d');
                            canvas.height = 150;
                            canvas.width = 120;

                            // Render PDF page into canvas context.
                            var renderContext = {
                                canvasContext: context,
                                viewport: viewport,

                            };
                            page.render(renderContext);
                        });
                    });
                }
            }
        });
    }

});
