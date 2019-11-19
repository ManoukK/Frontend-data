//Basis code van https://www.youtube.com/watch?v=NlBt-7PuaLk&list=PL9yYRbwpkykvOXrZumtZWbuaXWHvjD8gi&index=7
//Ik heb meegeschreven en uiteindelijk met hulp van andere code de assen omgedraait

// g staat voor group

import { select, 
  csv, 
  scaleLinear, 
  max, 
  scaleBand,
  axisLeft,
  axisBottom
 } from 'd3';


const svg = select('svg');

// + zet stings om in nummers
const width = +svg.attr('width');
const height = +svg.attr('height');

//basis regels voor de bar chart
const render = data => {
const yValue = d => d.population;
const xValue = d => d.country;
const margin = {top: 50, right: 50, bottom: 150, left: 100};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

//ticks maken met dezelfde tussensprongen
const yScale = scaleLinear()
.domain([0, max(data, yValue)])
.range([innerHeight, 0]);

//per land een bar maken
const xScale = scaleBand()
.domain(data.map(xValue))
.range([0, innerWidth])
.padding(0.2);


//betere margin maken
const g = svg.append('g')
.attr('transform', `translate(${margin.left},${margin.top})`);


const xAxisGroup = g.append('g')
.call(axisBottom(xScale))
//X as onder zetten ipv boven
.attr('transform', `translate(0,${innerHeight})`)
.append('text') 
  //tekst onder de as plaatsen
  .attr('y', 35)
  //bottom tekst in het midden zetten
  .attr('x', innerWidth / 2)
    .attr('fill', 'black')
  .text('Categoriën')

//alle lijnen onder de ticklanden weghalen
//via: https://www.youtube.com/watch?v=c3MCROTNN8g&list=PL9yYRbwpkykvOXrZumtZWbuaXWHvjD8gi&index=9
g.call(axisBottom(xScale))
.selectAll('.tick line')
  .remove();

const yAxisGroup = g.append('g')
.call(axisLeft(yScale))
.append('text')
   .attr('x', -120)
  .attr('y', -60)
  .attr('fill', 'black')
  .text('Aantal objecten')
  .attr('transform', `rotate(-90)`);

//rechthoeken maken
g.selectAll('rect').data(data)
.enter().append('rect')
    .attr('x', d => xScale(xValue(d)))
    .attr('width', d => xScale.bandwidth())
    //deze onderste twee regels code van: 
    //https://codepen.io/bclinkinbeard/pen/aqOLNq?editors=1010 
    //Dit 'invert' de bars omdat 0 eigenlijk boven is. 
    .attr('y', d => yScale(yValue(d)))
    .attr('height', d => innerHeight - yScale(yValue(d)));
};

//csv data inladen en omzetten
csv('data.csv').then(data => {
data.forEach(d => {
d.population = +d.population;
});
render(data);
});

