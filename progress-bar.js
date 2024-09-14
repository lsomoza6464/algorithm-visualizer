import { Visualizer } from "./visualizer.js";

export class ProgressBar {
    constructor(visualizer, snapshots, width = 50, height = 20) {
        this.container = d3.select('#slider-container')
            .style('position', 'relative')
            .style('box-sizing', 'border-box')
            .attr('width', 300)
            .attr('height', 30);
        this.visualizer = visualizer;
        this.snapshots = snapshots;
        this.value = 1;
        this.maxValue = snapshots.length;
    }

    visualizeBar(maxValue = 20) {
        const visualizer = this.visualizer;
        const snapshots = this.snapshots;
        let value = 1
        const label = this.container.append('div')
            .style('position', 'absolute')
            .style('left', '50%')
            .style('top', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .text(`${value}/${maxValue}`);
        const svg = this.container
        .append('svg')
        .attr('width', 300)
        .attr('height', 30)
        .attr('id', 'sliderSvg');

        // 2. Create progress bar background
        const progressBarBackground = svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 300)
        .attr('height', 30)
        .attr('fill', 'lightgray');

        // 3. Create progress bar fill (initially empty)
        const progressBarFill = svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 30)
        .attr('fill', 'steelblue')
        .attr('width', 0/*Math.max(0, Math.min(300, clickedX))*/); 

        // 4. Attach click and drag behavior to the background
        progressBarBackground.call(d3.drag()
        .on('start drag', function(event) {
            updateProgressBar(event.x);
        })
        ).on('click', function(event) {
            updateProgressBar(event.x);
        });
        progressBarFill.call(d3.drag()
        .on('start drag', function(event) {
            updateProgressBar(event.x);
        })
        ).on('click', function(event) {
            updateProgressBar(event.x);
        }); 

        function updateProgressBar(clickedX) {
            const newWidth = Math.max(0, Math.min(300, clickedX));
            progressBarFill.attr('width', newWidth);
            let oldValue = value;
            value = Math.round(newWidth / 300 * (maxValue - 1)) + 1; 
            label.text(`${value}/${maxValue}`);
            if (oldValue != value) {
                visualizeValueChange(value);
            }
            //console.log('Selected value:', value); 
        }

        function visualizeValueChange(value) {
            console.log('snapshots', snapshots[value - 1]);
            visualizer.clear();
            visualizer.visualizeAll(snapshots[value - 1]);
        }
    }
    iterateProgressBar() {
        if (this.value < this.maxValue) {
            this.value += 1;
        }
    }
    clearContainer() {
        this.container.html('');
    }
}