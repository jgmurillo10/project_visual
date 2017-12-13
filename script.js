(function () {
  var svg = d3.select("svg");
  var w = window,
      d = document,
      e = d.documentElement,
      x,
      y;
  function updateWindow(){
      x = w.innerWidth || e.clientWidth || g.clientWidth;
      y = w.innerHeight|| e.clientHeight|| g.clientHeight;

      svg.attr("width", x*0.98).attr("height", y*0.85);
  }
  updateWindow();
  d3.select(window).on('resize.updatesvg', updateWindow);
  var tooltip = d3.select("body")
                  .append("div")
                  .attr("class", "tooltip")
                  .text("a simple tooltip");
  var popover = d3.select("body")
                  .append("div")
                  .style("visibility", "visible")
                  .style("opacity",1)
                  .attr("class","popover")
  var instructions = "Here you can find a graph that represents the relationship between fulbright scientists according to their research topics. You can either hover any node that you might find interesting but also search for the reasearcher in intererest. If a node is hovered a card will be displayed showing the name, photo and description of the project or projects that the researcher is currently working on. Also, you can click a node to visualize just the node clicked and the first class family (?). To reset the view, click on the Reset view button in the top of the visualization."
  var popoverTitle = popover.append("h1")
                            .text("Instructions");
  var popoverContent = popover.append("div")
                              .text(instructions);
  var popoverBtn = popover.append("button")
                          .text("Close")
                          .on("click",closePopover);
  function closePopover() {
    console.log('closing');
    popover.style("visibility", "hidden")
           .style("opacity", 0)
           .style("z-index",-999);
  }
  var card = d3.select("body")
                  .append("div")
                  .attr("class", "card")
                  // .text("Here is where the information about the person your hover will be shown. Information like Name, photo and description about the project he/she is currently working on.");
  var title = card.append("h1")
                  .text("title");
  var src_img ="http://littleblackdressgala.ca/wp-content/uploads/2017/11/profile-placeholder-500x500.png"
  var img = card.append("img")
                .style("width","80%")
                .attr('src',src_img);
  card.append("br")
  var content = card.append("div")
                    .text("content");

  var width = x,
      height = y,
      radius = 5,
      previousNode = "",
      clicked = false,
      idLastClicked = "",
      graph;

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));
  var back = d3.select("#back")
                .on("click", handleBack);
  function handleBack() {
    clicked = false;
    document.getElementById('back').disabled = true;
    updateGraph();
  }

  function updateGraph() {
    d3.selectAll("g").remove();
    d3.selectAll("title").remove()
    tooltip.text('');
    var link = svg.append("g")
                  .attr("class", "links")
                  .selectAll("line")
                  .data(graph.links)
                  .enter().append("line")
                  .attr("stroke-width", function(d) { return Math.sqrt(d.value); });
    var selection = d3.select("#opts")
                      .on("change", handleChangeSelect);
    var options = selection.selectAll("option")
                    .data(graph.nodes);
    options.enter()
           .append("option")
           .text(d =>d.id )
           .attr('value',d => d.id);
    options.text(d=> d.id)
    options.exit().remove();
    var node = svg.append("g")
                  .attr("class", "nodes")
                  .selectAll("circle")
                  .data(graph.nodes)
                  .enter().append("circle")
                  .attr("id",d => d.id.replace(' ','-'))
                  .attr("r", radius)
                  .attr("fill", d => color(d.group))
                  .call(d3.drag()
                      .on("start", dragstarted)
                      .on("drag", dragged)
                      .on("end", dragended))
                      .on("mouseover", handleMouseOver)
                      .on("mouseout", handleMouseOut)
                      .on("mousemove", handleMouseMove)
                      .on("click", handleClick);

    node.append("title")
        .text(function(d) { return d.id; });
    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
              .links(graph.links);

    function ticked() {
      //boundaries into the svg
      link
          .attr("x1", function(d) { return d.source.x = Math.max(radius, Math.min(x - radius*10,  d.source.x)); })
          .attr("y1", function(d) { return d.source.y = Math.max(radius, Math.min(y - radius*25, d.source.y)); })
          .attr("x2", function(d) { return d.target.x = Math.max(radius, Math.min(x - radius*10, d.target.x)); })
          .attr("y2", function(d) { return d.target.y = Math.max(radius, Math.min(y - radius*25, d.target.y)); });
      node
          .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(x - radius*2, d.x)); })
          .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(y - radius*25, d.y)); });
    }
    function handleMouseOver(d){
      card.style("visibility","visible")
      title.text(d.id);
      content.text(d.description);
      tooltip.text(d.id );
      if(clicked) {
        return tooltip.style("visibility", "visible");
      }
      else {
        var nodes = [];
        link.style('stroke-width', function(l) {
          if (d === l.source || d === l.target){
            if(!inArr(nodes,l.source))
              nodes.push(l.source);
            if(!inArr(l.target))
              nodes.push(l.target);
            return radius;
          }
        });
        link.style('stroke-opacity', function(l){
          if (d === l.source || d === l.target){
            return 0.8;
          }
          else {
            return 0.26
          }
        })
        node.attr('r', function(n){
          var inp = radius
          for (var i = 0; i < nodes.length; i++) {
            if (n.id === nodes[i].id){
              inp = radius+2
            }
          }
          return inp;
        })
        node.style('opacity', function(n) {
          var inp = 0.4;
          for (var i = 0; i < nodes.length; i++) {
            if (n.id === nodes[i].id){
              inp = 1;
            }
          }
          return inp;
        })
        d3.select(this).attr("r", 12);
        return tooltip.style("visibility", "visible");
      }
    }
    function inArr(arr,item){
      for (var i = 0; i < arr.length; i++) {
        if(arr[i].id === item.id)
          return true;
      }
      return false;
    }
    function handleMouseMove(d){
      return tooltip.style("top",
         (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
    }

    function handleMouseOut(d,i){
      // card.style("visibility","hidden")
      if(clicked)
        return;
      link.style('stroke-width', function(l) {
          Math.sqrt(l.value);
        });
      link.style('stroke-opacity', function(l){
        if (d === l.source || d === l.target)
          return 0.26;
      });

      node.attr('r', function(n){
        return 5;
      });
      node.style('opacity', 1.0);
      return tooltip.style("visibility", "hidden");
    }
    function handleClick(d) {
      if(idLastClicked === d.id){
        updateGraph();
        idLastClicked="";
        clicked = false;
        document.getElementById('back').disabled = true;
        return;
      }
      idLastClicked=d.id;
      var nodes = [];
      link.style('stroke-width', function(l) {
        if (d === l.source || d === l.target){
          if(!inArr(nodes,l.source))
            nodes.push(l.source);
          if(!inArr(l.target))
            nodes.push(l.target);
          return radius;
        }
      });
      //if there are no Association or links then do nothing
      if (nodes.length === 0) {
        return;
      }
      node.attr('r', function(n){
        var inp = 0
        for (var i = 0; i < nodes.length; i++) {
          if (n.id === nodes[i].id){
            inp = radius+2
          }
        }
        return inp;
      })
      node.style('opacity', function(n) {
        var inp = 0.0;
        for (var i = 0; i < nodes.length; i++) {
          if (n.id === nodes[i].id){
            inp = 1;
          }
        }
        return inp;
      })
      link.style('stroke-opacity', function(l){
        if (d === l.source || d === l.target){
          return 0.8;
        }
        else {
          return 0;
        }
      })
      d3.select(this).attr("r", 12);
      tooltip.text(d.id );
      clicked = true;
      document.getElementById('back').disabled = false;
      return tooltip.style("visibility", "visible");
    }
    function handleChangeSelect() {
      selectedValue = selection.property('value');
      var nodeSelected;
      var nodePrev;
      node.attr('r',function (d,i) {
        if(d.id === selectedValue)
            return 15;
        else
            return radius;
      })
      previousNode = selectedValue;
    }
  }
  d3.json("graph.json", function(error, newgraph) {
    if (error) throw error;
    graph = newgraph
    updateGraph()
  });
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
})();
