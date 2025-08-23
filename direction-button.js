export class DirectionButton {
    constructor(direction, progressBar) {
        this.progressBar = progressBar;
        this.direction = direction;
        if (direction == 'left') {
            this.container = d3.select('#left-container')
                .style('position', 'relative')
                .style('box-sizing', 'border-box')
                .attr('width', 300)
                .attr('height', 30);
            this.button = this.container.append('button')
                .text('left')
                //.on('click', console.log('blahblah'))
                .on('click', () => progressBar.deterateProgressBar());
        } else {
            this.container = d3.select('#right-container')
                .style('position', 'relative')
                .style('box-sizing', 'border-box')
                .attr('width', 300)
                .attr('height', 30);
            this.button = this.container.append('button')
                .text('right')
                //.on('click', console.log('blahblah'))
                .on('click', () => progressBar.iterateProgressBar());
        }
    }
}