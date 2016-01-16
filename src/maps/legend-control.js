
const LegendControl = L.Control.extend({
    options: {
        position: 'bottomleft'
    },

    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'legend-control');
        this.container = d3.select(container);
        return container;
    },

    update: function(scale, variable, year) {
        this.container.selectAll('*').remove();

        const dimension = 10;
        const range = scale.range.slice();
        range.reverse();
        const height = range.length * dimension;
        const labelPadding = 100;

        const legendContainer = this.container
            .append('div')
            .attr('class', 'legend-container');

        const values = _.filter(scale.values, value => !(isNaN(value)));
        const [min, max] = d3.extent(values);
        const lowerQuartile = d3.quantile(values, 0.25);
        const median = d3.median(values);
        const upperQuartile = d3.quantile(values, 0.75);

        const tickLabels = ['maximum', 'upper quartile', 'median', 'lower quartile', 'minimum'];
        const tickValues = [max, upperQuartile, median, lowerQuartile, min];
        const tickStep = height / (tickValues.length - 1);

        const legend = legendContainer
            .append('svg')
            .attr('height', height + 15)
            .attr('class', 'legend');

        const tickGroup = legend
            .append('g')
            .attr('class', 'ticks');

        const ticks = tickGroup
            .selectAll('g.tick')
            .data(tickValues)
            .enter()
            .append('g')
            .attr('class', 'tick')
            .attr('transform', (__, index) => {
                return `translate(${labelPadding + dimension}, ${dimension + index * tickStep})`;
            });

        ticks
            .append('line')
            .attr('class', 'tick-line')
            .attr('x1', -dimension).attr('y1', 0)
            .attr('x2', dimension * 2).attr('y2', 0);

        const baseline = 'middle';
        const padding = 2;

        ticks
            .append('text')
            .attr('class', 'tick-value')
            .text(value => variable.format(value))
            .attr('alignment-baseline', baseline)
            .attr('transform', `translate(${dimension * 2 + padding}, 0)`);

        const labelGroup = legend
            .append('g')
            .attr('class', 'labels');

        const labels = labelGroup
            .selectAll('text')
            .data(tickLabels)
            .enter()
            .append('text')
            .attr('class', 'tick-label')
            .text(label => label)
            .attr('text-anchor', 'end')
            .attr('alignment-baseline', baseline)
            .attr('transform', (__, index) => {
                return `translate(${labelPadding - padding}, ${dimension + index * tickStep})`;
            });

        const colors = legend
            .selectAll('rect')
            .data(range)
            .enter()
            .append('rect')
            .attr('class', 'legend-element')
            .attr('x', labelPadding + dimension)
            .attr('y', (__, index) => (index + 1) * dimension)
            .attr('width', dimension)
            .attr('height', dimension)
            .style('stroke', 'none')
            .style('fill', color => color);

        legend
            .append('rect')
            .attr('class', 'legend-box')
            .attr('x', labelPadding + dimension).attr('y', dimension)
            .attr('width', dimension).attr('height', height);

        legend.attr('width', legend.node().getBBox().width + dimension * 2 + labelPadding);
    }
});

