pdfjsLib.GlobalWorkerOptions.workerSrc = "../static/pdf.worker.js";

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null) {
       return null;
    }
    return decodeURI(results[1]) || 0;
}

var cursor_string = {
    eraser: "data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='1em' height='1em' viewBox='0 0 24 24' style='enable-background:new 0 0 512 512;' xml:space='preserve'%3E %3Cpath d='M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53l-4.95-4.95l-4.95 4.95z'/%3E %3C/svg%3E",
    pencil: "data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='1em' height='1em' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512;' xml:space='preserve'%3E %3Cpath d='M403.914,0L54.044,349.871L0,512l162.128-54.044L512,108.086L403.914,0z M295.829,151.319l21.617,21.617L110.638,379.745 l-21.617-21.617L295.829,151.319z M71.532,455.932l-15.463-15.463l18.015-54.043l51.491,51.491L71.532,455.932z M153.871,422.979 l-21.617-21.617l206.809-206.809l21.617,21.617L153.871,422.979z M382.297,194.555l-64.852-64.852l21.617-21.617l64.852,64.852	L382.297,194.555z M360.679,86.468l43.234-43.235l64.853,64.853l-43.235,43.234L360.679,86.468z'/%3E %3C/svg%3E"
}

var ePen = (function ePenClosure(){
    function ePen(option){
        this.url = option.url,
        this.fileID = option.fileID
        this._pencil = option._pencil || false,
        this._rectangle = option._rectangle || false,
        this._eraser = option._eraser || false,
        this._text = option._text || false,
        this._color = option._color || false,
        this.colorSelected = option.colorSelected || '#000251',
        this._cloud_download = option._cloud_download || false,
        this._scale = 1.5,
        this.pencilHistory = [],
        this.rectangleHistory = [],
        this.textHistory = [],
        this.drawOption = null,
        this.eraser_shape = 4,
        this.isMouseDown = option.isMouseDown || false;
    }


    ePen.prototype = {
        _load_pdf : function() {
            //pdfjsLib.getDocument(url)
            pdfjsLib.getDocument({data: atob(url),}).then(function(pdf){
                // Get div#container and cache it for later use
                var container = document.getElementById("container");
                // Loop from 1 to total_number_of_pages in PDF document
                for (var i = 1; i <= pdf.numPages; i++) {
                    // Get desired page
                    pdf.getPage(i).then(function(page) {
                        var viewport = page.getViewport(this._scale);
                        var div = document.createElement("div");

                        // Set id attribute with page-#{pdf_page_number} format
                        div.setAttribute("id", "page-" + (page.pageIndex + 1));

                        // This will keep positions of child elements as per our needs
                        div.setAttribute("style", "position: relative");

                        // Append div within div#container
                        container.appendChild(div);

                        // Create a new Canvas element
                        var canvas = document.createElement("canvas");
                        canvas.id = "canvas-" + (page.pageIndex+1).toString();

                        // Append Canvas within div#page-#{pdf_page_number}
                        div.appendChild(canvas);

                        //add another canvas to display draw
                        var showEditCanvas = document.createElement("canvas");
                        showEditCanvas.id = "show_canvas-" + (page.pageIndex+1).toString();
                        showEditCanvas.setAttribute("class", "boxCanvas");
                        showEditCanvas.height = viewport.height;
                        showEditCanvas.width = viewport.width;
                        div.appendChild(showEditCanvas);

                        //add another canvas to draw
                        var drawCanvas = document.createElement("canvas");
                        drawCanvas.id = "draw_canvas-" + (page.pageIndex+1).toString();
                        drawCanvas.setAttribute("class", "boxCanvas drawLayer");
                        drawCanvas.height = viewport.height;
                        drawCanvas.width = viewport.width;
                        drawCanvas.setAttribute("onmousemove", `ePen.prototype.drawCanvasMouseHoverEvent(event, ${page.pageIndex+1})`);
                        drawCanvas.setAttribute("onmouseout", "ePen.prototype.drawCanvasMouseOutEvent()");
                        div.appendChild(drawCanvas);

                        //add
                        var context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        var renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };

                         // Render PDF page
                         page.render(renderContext)
                         .then(function() {
                            // Get text-fragments
                            return page.getTextContent();
                         })
                         .then(function(textContent){
                            // Create div which will hold text-fragments
                            var textLayerDiv = document.createElement("div");

                            // Set it's class to textLayer which have required CSS styles
                            textLayerDiv.setAttribute("class", "textLayer");

                            // Append newly created div in `div#page-#{pdf_page_number}
                            div.appendChild(textLayerDiv);

                            // Create new instance of TextLayerBuilder class
                            var textLayer = new TextLayerBuilder({
                                textLayerDiv: textLayerDiv,
                                pageIndex: page.pageIndex,
                                viewport: viewport
                            });

                            // Set text-fragments
                            textLayer.setTextContent(textContent);

                            // Render text-fragments
                            textLayer.render();

                         });

                    });
                }
            });
        },
        _load_toolbox : function(){
            $(".drawLayer").show();
            //get the toolbar container
            var toolbox_container = document.getElementById("nav-mobile");
            if(_pencil){
                $("#ipen_pencil").show()
            }
            if(_rectangle){
                $("#ipen_rectangle").show()
            }
            if(_eraser){
                $("#ipen_eraser").show()
            }
            if(_text){
                $("#ipen_text").show()
            }
            if(_color){
                $("#ipen_color").show()
            }
            if(_cloud_download){
                $("#ipen_cloud_download").show()
            }
        },
        drawCanvasMouseHoverEvent : function(event, page_number){

            document.addEventListener('mousedown', function(){
                isMouseDown = true;
            });

            if (drawOption == null) {
                this._clear_onmousedown(page_number);
            }

            if(drawOption=="pencil") {
                this._pencil_event_handler(page_number);
            }else if(drawOption=="rectangle") {
                this._rectangle__event_handler(page_number);
            }else if(drawOption=="text") {
                this._text_event_handler(page_number);
            }else if(drawOption=="eraser") {
                this._eraser__pencil_event_handler(page_number);
            }
            if(drawOption=="rectangle" && !isMouseDown){
                    if(rectangleHistory.length>0 && rectangleHistory[rectangleHistory.length-1].isAlive){
                        rectangleHistory[rectangleHistory.length-1].isAlive = false;
                        this.show_canvas_rectangle();
                    }
                }
            document.addEventListener('mouseup', function(){
                isMouseDown = false;
                if(pencilHistory.length>0 && pencilHistory[pencilHistory.length-1].isAlive){
                    pencilHistory[pencilHistory.length-1].isAlive=false;
                }

            });

            document.getElementById("draw_canvas-"+page_number).addEventListener('mousedown', function(){
                if(drawOption=="rectangle"){
                     if(rectangleHistory.length==0 || !rectangleHistory[rectangleHistory.length-1].isAlive){
                         rectangleHistory.push({
                             start: [],
                             end: [],
                             pageNumber: page_number,
                             isAlive : true,
                             color: colorSelected
                         });
                    }else if(!isMouseDown){
                        rectangleHistory[rectangleHistory.length-1].start = [event.offsetX, event.offsetY]
                        rectangleHistory[rectangleHistory.length-1].color= colorSelected
                    }
                }
            });

        },
        drawCanvasMouseOutEvent : function(){

            document.addEventListener('mouseup', function(){
                isMouseDown = false;
            });

            if(pencilHistory.length>0 && pencilHistory[pencilHistory.length-1].isAlive){
                pencilHistory[pencilHistory.length-1].isAlive=false;
            }
            if(drawOption=="rectangle"){
                if(rectangleHistory.length>0 && rectangleHistory[rectangleHistory.length-1].isAlive){
                    rectangleHistory[rectangleHistory.length-1].isAlive = false;
                    this.show_canvas_rectangle();
                }
            }
        },
        _pencil_click_event: function(){
            if (drawOption == null){
                $(".textLayer").hide();
                $(".drawLayer").show();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'url("' + cursor_string.pencil + '"), auto');});
            }
            if (drawOption == "pencil"){
                drawOption = null;
                $(".textLayer").show();
                $(".drawLayer").hide();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'pointer');});
            }else{
                drawOption = "pencil";
                $(".drawLayer").hover(function(){$(this).css("cursor", 'url("' + cursor_string.pencil + '"), auto');});
            }
        },
        _rectangle_click_event: function(){
            if (drawOption == null){
                $(".textLayer").hide();
                $(".drawLayer").show();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'crosshair');});
            }
            if (drawOption == "rectangle"){
                drawOption = null;
                $(".textLayer").show();
                $(".drawLayer").hide();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'pointer');});
            }else{
                drawOption = "rectangle";
                $(".drawLayer").hover(function(){$(this).css("cursor", 'crosshair');});
            }
        },
        _eraser_click_event: function(){
            if (drawOption == null){
                $(".textLayer").hide();
                $(".drawLayer").show();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'url("' + cursor_string.eraser + '"), auto');});
            }
            if (drawOption == "eraser"){
                drawOption = null;
                $(".textLayer").show();
                $(".drawLayer").hide();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'pointer');});
            }else{
                drawOption = "eraser";
                $(".drawLayer").hover(function(){$(this).css("cursor", 'url("' + cursor_string.eraser + '"), auto');});
            }
        },
        _text_click_event: function(){
            if (drawOption == null){
                $(".textLayer").hide();
                $(".drawLayer").show();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'text');});
            }
            if (drawOption == "text"){
                drawOption = null;
                $(".textLayer").show();
                $(".drawLayer").hide();
                $(".drawLayer").hover(function(){$(this).css("cursor", 'pointer');});
            }else{
                drawOption = "text";
                $(".drawLayer").hover(function(){$(this).css("cursor", 'text');});
            }
        },
        _eraser__pencil_event_handler: function(page_number) {
            document.getElementById( "draw_canvas-" + page_number ).onmousedown = function (){
                if (drawOption == "eraser") {
                    //get the pencil events
                    pencilHistory = pencilHistory.filter(function(a){
                        return (a['pageNumber'] == page_number && a['track'].filter(
                            function(t){ return (event.offsetX-eraser_shape <= t[0] && t[0] <= event.offsetX+eraser_shape)
                                             && (event.offsetY-eraser_shape <= t[1] && t[1] <= event.offsetY+eraser_shape ) }
                        ).length == 0
                        )});

                    //get the rectangle evetns
                    rectangleHistory = rectangleHistory.filter(function(a) {
                        return (a['pageNumber'] == page_number && !(
                            //check is rectangle is in event phase
                            //top

                            (a.start[0] <= event.offsetX && a.end[0] >= event.offsetX
                                && event.offsetY-eraser_shape <= a.start[1] && a.start[1] <= event.offsetY+eraser_shape)
                            ||//bottom
                            (a.start[0] <= event.offsetX && a.end[0] >= event.offsetX
                                && event.offsetY-eraser_shape <= a.end[1] && a.end[1] <= event.offsetY+eraser_shape)
                            ||//left
                            (a.start[1] <= event.offsetY && a.end[1] >= event.offsetY
                                && event.offsetX-eraser_shape <= a.start[0] && a.start[0] <= event.offsetX+eraser_shape)
                            ||//right
                            (a.start[1] <= event.offsetY && a.end[1] >= event.offsetY
                                && event.offsetX-eraser_shape <= a.end[0] && a.end[0] <= event.offsetX+eraser_shape)
                        ));
                    });

                    ePen.prototype._redraw_shapes(page_number);

                }
            }
        },
        _redraw_shapes: function(page_number) {
            console.log("Tes");
            //clear all the page
            const paintCanvas = document.getElementById( "show_canvas-"+page_number );
            const context = paintCanvas.getContext( '2d' );

            var rectangleData = rectangleHistory[rectangleHistory.length-1];
            context.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

            //draw pencil data
            context.lineCap = 'round';
            context.beginPath();
            for (var i=0; i<pencilHistory.length; i++) {
                for (var t=0; t< pencilHistory[i]['track'].length-1; t++) {
                    //draw line
                    context.strokeStyle = pencilHistory[i].color;
                    context.moveTo( pencilHistory[i]['track'][t][0], pencilHistory[i]['track'][t][1] );
                    context.lineTo( pencilHistory[i]['track'][t+1][0], pencilHistory[i]['track'][t+1][1] );
                    context.stroke();
                }
            }

            //draw rectangle data
            for(var i=0; i<rectangleHistory.length; i++) {
                //draw rectangle
                var rectangleData = rectangleHistory[i];
                context.strokeStyle = rectangleData.color;
                context.strokeRect(rectangleData.start[0], rectangleData.start[1],
                    rectangleData.end[0]-rectangleData.start[0], rectangleData.end[1]-rectangleData.start[1]);
            }

            //draw text data
            for (var i=0; i<textHistory.length; i++){
                context.font = "30px Times-Roman";
                context.fillText(textHistory[i].comment, textHistory[i].axis[0], textHistory[i].axis[1]);
                this._text_click_event();
            }
        },
        _clear_onmousedown: function(page_number){
            document.getElementById( "draw_canvas-" + page_number ).onmousedown = function(){
            }
        },
        _pencil_event_handler: function(page_number){
            if(isMouseDown){
                var oldX=null;
                var oldY=null;
                if(pencilHistory.length==0 || !pencilHistory[pencilHistory.length-1].isAlive){
                    pencilHistory.push({
                        track: [],
                        trackLength: -1,
                        pageNumber: page_number,
                        isAlive : true,
                        color: colorSelected
                    });
                }else{
                    var history = pencilHistory[pencilHistory.length-1];
                    [oldX, oldY] = history.track[history.trackLength];
                }
                const paintCanvas = document.getElementById( "show_canvas-"+page_number );
                const context = paintCanvas.getContext( '2d' );
                context.lineCap = 'round';
                const newX = event.offsetX;
                const newY = event.offsetY;
                if (oldX == null || oldY == null){
                    pencilHistory[pencilHistory.length-1].track.push([newX, newY]);
                    pencilHistory[pencilHistory.length-1].trackLength += 1;
                    return;
                }
                context.beginPath();
                context.strokeStyle = pencilHistory[pencilHistory.length-1].color;
                context.moveTo( oldX, oldY );
                context.lineTo( newX, newY );
                context.stroke();
                pencilHistory[pencilHistory.length-1].track.push([newX, newY]);
                pencilHistory[pencilHistory.length-1].trackLength += 1;
            }else{

            }
        },
        _rectangle__event_handler: function(page_number){

            if(isMouseDown){
                if(rectangleHistory.length>0 && rectangleHistory[rectangleHistory.length-1].isAlive){}{
                    rectangleHistory[rectangleHistory.length-1].end = [event.offsetX, event.offsetY];
                    const paintCanvas = document.getElementById( "draw_canvas-"+page_number );
                    const context = paintCanvas.getContext( '2d' );
                    context.setLineDash([6]);

                    var rectangleData = rectangleHistory[rectangleHistory.length-1];

                    context.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
                    context.strokeStyle = rectangleData.color;
                    context.strokeRect(rectangleData.start[0], rectangleData.start[1],
                        rectangleData.end[0]-rectangleData.start[0], rectangleData.end[1]-rectangleData.start[1]);

                }
            }
        },
        show_canvas_rectangle: function(){
            var rectangleData = rectangleHistory[rectangleHistory.length-1];
            var page_number = rectangleData.pageNumber;
            var paintCanvas = document.getElementById( "show_canvas-"+page_number );
            var context = paintCanvas.getContext( '2d' );

            context.strokeStyle = rectangleData.color;
            context.strokeRect(rectangleData.start[0], rectangleData.start[1],
                rectangleData.end[0]-rectangleData.start[0], rectangleData.end[1]-rectangleData.start[1]);
            paintCanvas=document.getElementById( "draw_canvas-"+page_number );
            context = paintCanvas.getContext( '2d' );
            context.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
        },
        _text_event_handler: function(page_number){
            document.getElementById( "draw_canvas-" + page_number ).onmousedown = function() {
                axis = [event.offsetX, event.offsetY];
                var comment = prompt("Please enter your commet");
                textHistory.push({
                    axis: axis,
                    comment: comment,
                    pageNumber: page_number,
                });
                console.log(axis);
                var canvas = document.getElementById("show_canvas-"+page_number);
                var ctx = canvas.getContext("2d");
                ctx.font = "30px Times-Roman";
                ctx.fillText(comment, axis[0], axis[1]);
                ePen.prototype._text_click_event();
            }
        },
        _submmit_details: function(){

            jQuery('<form action="/applyChanges/" id="applyChanges" method="'+ ('post'||'post') +'" target="_blank" ></form>').appendTo('body')
            var $hidden = $("<input type='hidden' name='fileID'/>");
            $hidden.val(fileID);
            var $action = $("<input type='hidden' name='action'/>");
            $action.val(JSON.stringify({"pencil": pencilHistory, "rectangle": rectangleHistory, "text": textHistory}));
            var $cookies = $("<input type='hidden' name='csrfmiddlewaretoken'/>");
            $cookies.val(getCookie('csrftoken'));
            $('#applyChanges').append($hidden);
            $('#applyChanges').append($action);
            $('#applyChanges').append($cookies);
            $('#applyChanges').submit();


        },
        _changecolor_event: function(){
            colorSelected = $("#coloPricker").val();
        }

    }
    return ePen;
})();

$( document ).ready(function() {

    $.ajax({
        url: "/getFile/",
        type: "POST",
        data: {"fileID": $.urlParam('id')},
        success: function(response){
            if('error' in response){
                alert(response['error']);
            }else{
                pen = ePen({
                    url: response['fileData'],
                    _pencil: true,
                    _rectangle: true,
                    _eraser: true,
                    _text: true,
                    _color: true,
                    _cloud_download: true,
                    fileID: $.urlParam('id')
                });

                ePen.prototype._load_pdf()
                ePen.prototype._load_toolbox();
            }
        }
    });
});



