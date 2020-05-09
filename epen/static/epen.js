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

window.onkeydown = function(e) {
    return !(e.keyCode == 32);
};

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
        this.colorSelected = option.colorSelected || '#000000',
        this._cloud_download = option._cloud_download || false,
        this._scale = 1.5,
        this.pencilHistory = [],
        this.rectangleHistory = [],
        this.textHistory = [],
        this.drawOption = null,
        this.eraser_shape = 8,
        this.isMouseDown = option.isMouseDown || false,
        this.textDragging = false,
        this.selectedIndex = [],
        this.currentPageIndex = 0,
        this.isTextEditing = false;
    }

    jQuery(document).on('keydown', function(e){
        if (e.key === "Escape"){
            if (textDragging){
                textDragging = false;
                textHistory[selected_index[0]].border = false;
                selected_index = [];
                ePen.prototype._redraw_shapes(currentPageIndex);
            }else if (isTextEditing){
                isTextEditing = false;
                textHistory[textHistory.length-1].border = false;
                ePen.prototype._redraw_shapes(currentPageIndex);
            }
        }

        if ((e.which >= 48 && e.which <= 90) ||
                (e.which >= 96 && e.which <= 111) ||
                (e.which >=186 && e.which <= 222) ||
                 e.which == 32){
            if (textHistory[textHistory.length-1].comment.indexOf("|")>-1){
                textHistory[textHistory.length-1].comment = textHistory[textHistory.length-1].comment.replace("|", "");
            }
            textHistory[textHistory.length-1].comment += e.key.toString();
        }

        if (e.which == 8){
            if (textHistory[textHistory.length-1].comment.indexOf("|")>-1){
                textHistory[textHistory.length-1].comment = textHistory[textHistory.length-1].comment.replace("|", "");
            }
            textHistory[textHistory.length-1].comment =
                textHistory[textHistory.length-1].comment.substring(0, textHistory[textHistory.length-1].comment.length - 1);
        }

        if(e.key === "Delete") {
            if(textDragging){
                textDragging = false;
                textHistory = textHistory.filter(function(a, i){
                    return i != selected_index[0];
                });
                selected_index= [];
                ePen.prototype._redraw_shapes(currentPageIndex);
            }
        }
    });

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

            currentPageIndex = page_number;

            document.addEventListener('mousedown', function(){
                isMouseDown = true;
            });

            if (drawOption == null) {
                this._clear_onmousedown(page_number);
            }

            if (drawOption != 'text') {
                textDragging = false;
                selected_index = [];
            }

            if(drawOption=="pencil") {
                this._clear_onmousedown(page_number);
                this._pencil_event_handler(page_number);
            }else if(drawOption=="rectangle") {
                this._clear_onmousedown(page_number);
                this._rectangle__event_handler(page_number);
            }else if(drawOption=="text") {
                this._text_event_handler(page_number);
            }else if(drawOption=="eraser") {
                this._clear_onmousedown(page_number);
                this._eraser__pencil_event_handler(page_number);
            }
            if(drawOption=="rectangle" && !isMouseDown){
                    if(rectangleHistory.length>0 && rectangleHistory[rectangleHistory.length-1].isAlive){
                        rectangleHistory[rectangleHistory.length-1].isAlive = false;
                        this.show_canvas_rectangle();
                    }
            }

            if(drawOption=="text" && !isMouseDown){
                    if(textHistory.length>0 && textHistory[textHistory.length-1].isAlive){
                        if (textHistory[textHistory.length-1].end == []){
                            textHistory.pop(textHistory.length-1);
                            return;
                        }
                        textHistory[textHistory.length-1].isAlive = false;
                        isTextEditing = true;
                        var paintCanvas=document.getElementById( "draw_canvas-"+page_number );
                        var context = paintCanvas.getContext( '2d' );
                        context.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
                        this._text_blinker(page_number);
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
                if (drawOption == "text" && !textDragging){
                    if (!textDragging) {
                         ePen.prototype._is_clicked_on_text(page_number);
                    }
                    if (!textDragging) {
                        if(textHistory.length==0 || !textHistory[textHistory.length-1].isAlive){
                             textHistory.push({
                                 start: [],
                                 end: [],
                                 comment: '',
                                 pageNumber: page_number,
                                 isAlive : true,
                                 color: colorSelected,
                                 border: true,
                                 textSize: 30
                             });
                        }else if(!isMouseDown){
                            textHistory[textHistory.length-1].start = [event.offsetX, event.offsetY]
                            textHistory[textHistory.length-1].color= colorSelected
                        }
                    }
                }
            });

        },
        drawCanvasMouseOutEvent : function() {

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

            textDragging = false;
            selected_index = [];
        },
        //pencil features
        _pencil_click_event: function() {
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
        _pencil_event_handler: function(page_number) {
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
        //rectangle features
        _rectangle_click_event: function() {
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
        _rectangle__event_handler: function(page_number) {

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
        show_canvas_rectangle: function() {
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
        //eraser features
        _eraser_click_event: function() {
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
        _eraser__pencil_event_handler: function(page_number) {
            document.getElementById( "draw_canvas-" + page_number ).onmousedown = function (){
                if (drawOption == "eraser") {
                    //get the pencil events
                    pencilHistory = pencilHistory.filter(function(a){
                        return (a['pageNumber'] == page_number && a['track'].filter(
                            function(t, index){
                                if(index < a['track'].length-1){
                                    var x_sub = 0;
                                    var y_sub = 0;
                                    var m = (a['track'][index+1][1] - t[1]) / (a['track'][index+1][0] - t[0])
                                    var b = (t[1] - m*t[0])
                                    return  event.offsetY-y_sub > (m* (event.offsetX-x_sub) + (b-eraser_shape))
                                            && event.offsetY-y_sub < (m* (event.offsetX-x_sub) + (b+eraser_shape))
                                            && (event.offsetX-x_sub) + eraser_shape >= t[0]
                                            && a['track'][index+1][0] >= (event.offsetX-x_sub)-eraser_shape;

//                                    return (event.offsetX >= t[0]
//                                            && a['track'][index+1][0] >= event.offsetX)
//                                            && (event.offsetY-eraser_shape <= t[1]
//                                            && a['track'][index+1][1] <= event.offsetY+eraser_shape )
                                }else{
                                    return (event.offsetX-eraser_shape <= t[0] && t[0] <= event.offsetX+eraser_shape)
                                                     && (event.offsetY-eraser_shape <= t[1] &&
                                                     t <= event.offsetY+eraser_shape )
                                }
                            }
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
                context.font = textHistory[i].textSize.toString() + "px Times-Roman";
                if (textHistory[i].border){
                    context.strokeStyle = "black";
                    context.strokeRect(textHistory[i].start[0], textHistory[i].start[1],
                        textHistory[i].end[0]-textHistory[i].start[0], textHistory[i].end[1]-textHistory[i].start[1]);
                }
                //check the width of the text
                var box_text_strength = (textHistory[i].end[0]-textHistory[i].start[0]) / (textHistory[i].textSize / 2.5);
                box_text_strength = (box_text_strength).toFixed(2);
                var n = 0;
                while (n*box_text_strength < textHistory[i].comment.length) {
                    var comment = textHistory[i].comment.substring(n*box_text_strength, (n+1)*box_text_strength);
                    context.fillText(comment, textHistory[i].start[0]+5,
                        textHistory[i].start[1]+(n+1)*textHistory[i].textSize);
                    n += 1;
                }

            }
        },
        _clear_onmousedown: function(page_number) {
            document.getElementById( "draw_canvas-" + page_number ).onmousedown = function(){
            }
        },
        //text features
        _text_click_event: function() {
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
        _text_event_handler: function(page_number) {
            if(isMouseDown && !isTextEditing) {
                //search is it clicked on text

                if (selected_index.length == 0 && !textDragging){

                    if(textHistory.length>0 && textHistory[textHistory.length-1].isAlive){}{
                        textHistory[textHistory.length-1].end = [event.offsetX, event.offsetY];
                        const paintCanvas = document.getElementById( "draw_canvas-"+page_number );
                        const context = paintCanvas.getContext( '2d' );
                        context.setLineDash([6]);

                        var textData = textHistory[textHistory.length-1];

                        context.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
                        context.strokeStyle = textData.color;
                        context.strokeRect(textData.start[0], textData.start[1],
                            textData.end[0]-textData.start[0], textData.end[1]-textData.start[1]);

                    }
                }

                if (textDragging){
                    if (textHistory[selected_index[0]].pageNumber == page_number){
                        current_xy = [event.offsetX, event.offsetY];
                        movingxy = [textHistory[selected_index[0]].start[0]-current_xy[0],
                            textHistory[selected_index[0]].start[1]-current_xy[1]]
                        textHistory[selected_index[0]].start = current_xy;
                        textHistory[selected_index[0]].end = [textHistory[selected_index[0]].end[0]- movingxy[0],
                            textHistory[selected_index[0]].end[1]- movingxy[1]];
                        this._redraw_shapes(page_number);
                    }else{
                        textDragging = false;
                        selected_index = [];
                    }
                }
            }
        },
        _text_blinker: function(page_number){
            if (textHistory[textHistory.length-1].comment.indexOf("|")>-1){
                textHistory[textHistory.length-1].comment = textHistory[textHistory.length-1].comment.replace("|", "");
            }else{
                textHistory[textHistory.length-1].comment += "|";
            }
            this._redraw_shapes(currentPageIndex);
            if (isTextEditing) {
                setTimeout(function() { ePen.prototype._text_blinker(page_number); }, 500);
            }else{
                if (textHistory[textHistory.length-1].comment.indexOf("|")>-1){
                    textHistory[textHistory.length-1].comment = textHistory[textHistory.length-1].comment.replace("|", "");
                    this._redraw_shapes(currentPageIndex);
                }
            }
        },
        _is_clicked_on_text: function(page_number) {
            var search_index = textHistory.map(function(textData, index){
                if (textData.start[0] < event.offsetX && textData.end[0] > event.offsetX
                    && textData.start[1] < event.offsetY && textData.end[1] > event.offsetY
                    && textData.pageNumber == page_number && !textData.isAlive) {
                        return index;
                    }
                });
            var temp_selected_index = search_index.filter(function (searchData){return searchData != null});
            selected_index = temp_selected_index;
            textDragging = ((selected_index.length > 0) ? true : false);
            if(textDragging) {
                textHistory[selected_index[0]].border = true;
                this._redraw_shapes;
            }
        },
        //submit event
        _submit_details: function() {

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
        //color change event
        _changecolor_event: function(color_hex) {
            colorSelected = color_hex;
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

$(document).ready(function(ev) {
  var toggle = $('#ss_toggle');
  var menu = $('#ipen_color');
  var rot;

  $('#ss_toggle').on('click', function(ev) {
    rot = parseInt($(this).data('rot')) - 180;
    menu.css('transform', 'rotate(' + rot + 'deg)');
    menu.css('webkitTransform', 'rotate(' + rot + 'deg)');
    if ((rot / 180) % 2 == 0) {
      //Moving in
      toggle.parent().addClass('ss_active');
      toggle.addClass('close');
    } else {
      //Moving Out
      toggle.parent().removeClass('ss_active');
      toggle.removeClass('close');
    }
    $(this).data('rot', rot);
  });

  menu.on('transitionend webkitTransitionEnd oTransitionEnd', function() {
    if ((rot / 180) % 2 == 0) {
      $('#ipen_color div i').addClass('ss_animate');
    } else {
      $('#ipen_color div i').removeClass('ss_animate');
    }
  });

});