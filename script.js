// Set up dimensions and projection
const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

const projection = d3.geoMercator()
    .center([103.851959, 1.290270]) // Center coordinates of Singapore
    .scale(40000)                   // Adjust the scale as needed
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Load data
Promise.all([
    d3.json('sgmap.json'),
    d3.csv('population2023.csv')
]).then(([geoData, populationData]) => {
    const populationMap = new Map(populationData.map(d => [d.Subzone, +d.Population]));

    // Define color scale based on population density
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd) // Yellow to Red
        .domain([0, d3.max(populationData, d => +d.Population)]);

    // Draw map
    svg.selectAll('path')
        .data(geoData.features)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', d => {
            const population = populationMap.get(d.properties.SubzoneName) || 0;
            return colorScale(population);
        })
        .attr('stroke', '#333')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
            showTooltip(event, d);
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke', '#333').attr('stroke-width', 1);
            hideTooltip();
        });

    // Tooltip functions
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', '#fff')
        .style('padding', '8px')
        .style('border', '1px solid #ccc')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('display', 'none');

    function showTooltip(event, d) {
        const population = populationMap.get(d.properties.SubzoneName) || 0;
        tooltip.style('display', 'block')
            .html(`<strong>${d.properties.SubzoneName}</strong><br>Population: ${population}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px');
    }

    function hideTooltip() {
        tooltip.style('display', 'none');
    }

    // Legend setup
    const legendWidth = 200, legendHeight = 20;
    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 220}, ${height - 40})`);

    legend.selectAll('rect')
        .data(d3.range(0, 1.1, 0.1))
        .enter().append('rect')
        .attr('x', (d, i) => i * (legendWidth / 10))
        .attr('width', legendWidth / 10)
        .attr('height', legendHeight)
        .attr('fill', d => colorScale(d * colorScale.domain()[1]));

    legend.append('g')
        .attr('transform', `translate(0, ${legendHeight})`)
        .call(legendAxis);
});
