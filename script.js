let width = 1000, height = 600;

let svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height);

// Create a color scale for population with a color-blind friendly palette
let colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateViridis)  // Color-blind friendly palette
    .domain([0, 126460]);  // Population range: 0 to 126460

// Load external data and boot
Promise.all([d3.json("sgmap.json"), d3.csv("population2023.csv")]).then(data => {
    let mapData = data[0].features;
    let popData = data[1];

    // Merge population data with map data
    mapData.forEach(d => {
        let subzone = popData.find(e => e.Subzone.toUpperCase() == d.properties.Name);
        d.popdata = (subzone != undefined) ? parseInt(subzone.Population) : 0;
    });

    // Map projection and path generator
    let projection = d3.geoMercator()
        .center([103.851959, 1.290270])
        .fitExtent([[20, 20], [980, 580]], data[0]);

    let geopath = d3.geoPath().projection(projection);

    // Add districts to the map
    svg.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", geopath)
        .attr("stroke", "black")
        .attr("fill", d => colorScale(d.popdata)) // Color by population
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`<strong>${d.properties.Name}</strong><br>Population: ${d.popdata}`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
            d3.select("#tooltip").style("display", "none");
        });

     // Create a legend group
     let legendWidth = 300, legendHeight = 20;

     let legend = svg.append("g")
         .attr("class", "legend")
         .attr("transform", "translate(20, 20)");
 
     // Create a linear scale for the legend axis
     let legendScale = d3.scaleLinear()
         .domain([d3.min(mapData, d => d.popdata), d3.max(mapData, d => d.popdata)])
         .range([0, legendWidth]);
 
     // Create gradient for the legend
     let gradient = legend.append("defs")
         .append("linearGradient")
         .attr("id", "gradient")
         .attr("x1", "0%")
         .attr("y1", "0%")
         .attr("x2", "100%")
         .attr("y2", "0%");
 
     // Create gradient stops based on color scale
     gradient.selectAll("stop")
         .data(d3.range(0, 1, 1 / 10).map(t => {
             return {
                 offset: `${t * 100}%`,
                 color: colorScale(legendScale.invert(t * legendWidth))
             };
         }))
         .enter().append("stop")
         .attr("offset", d => d.offset)
         .attr("stop-color", d => d.color);
 
     // Add the gradient rectangle to the legend
     legend.append("rect")
         .attr("width", legendWidth)
         .attr("height", legendHeight)
         .style("fill", "url(#gradient)");
 
     // Add the axis to the legend
     legend.append("g")
         .attr("transform", "translate(0," + legendHeight + ")")
         .call(d3.axisBottom(legendScale)
             .tickFormat(d3.format(".0s"))
             .ticks(5));  // 5 ticks on the axis
 
 });
