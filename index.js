//Basis code van https://www.youtube.com/watch?v=NlBt-7PuaLk&list=PL9yYRbwpkykvOXrZumtZWbuaXWHvjD8gi&index=7
//Ik heb meegeschreven en uiteindelijk met hulp van andere code de assen omgedraait

// g staat voor group

import { select, 
    scaleLinear, 
    max, 
    scaleBand,
    axisLeft,
    axisBottom,
  	json,
    selectAll,
    axis,
    tickFormat
   } from 'd3';

const myQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
	PREFIX dc: <http://purl.org/dc/elements/1.1/>
	PREFIX dct: <http://purl.org/dc/terms/>
	PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
	PREFIX edm: <http://www.europeana.eu/schemas/edm/>
	PREFIX foaf: <http://xmlns.com/foaf/0.1/>
	PREFIX gn: <http://www.geonames.org/ontology#>

  SELECT ?continentLabel ?categoryLabel (COUNT(?cho) AS ?choCount) 
    WHERE {
         <https://hdl.handle.net/20.500.11840/termmaster2802> skos:narrower ?category .
         ?category skos:prefLabel ?categoryLabel .
         ?category skos:narrower* ?subcategory .

          ?cho edm:isRelatedTo ?subcategory .
          ?cho dct:spatial ?place .
          ?place skos:exactMatch/gn:countryCode ?countryCode  .
          FILTER(?countryCode != "ID")

          <https://hdl.handle.net/20.500.11840/termmaster2> skos:narrower ?continent .
           ?continent skos:prefLabel ?continentLabel .
           ?continent skos:narrower* ?place .
    } GROUP BY ?continentLabel ?categoryLabel
    ORDER BY DESC(?choCount)`

const endpoint = "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-13/sparql"

//Deze code zo gekregen dankzij Mohamad
//function is zo geschreven dat het herbruikbaar is. runQuery overschrijft de parameters
function runQuery(url, query) {
    return fetch(url + "?query=" + encodeURIComponent(query) + "&format=json")
        .then(res => res.json())
        .then(data => data.results.bindings)
      	.then(results => {
      		console.log(results)
        	return results.map(result => {
            return {
							continent: result.continentLabel.value,
							category: result.categoryLabel.value,
							objectCount: Number(result.choCount.value)
            }
        })
    })
        .catch(error => {
            console.log(error)
        })
};

runQuery(endpoint, myQuery)
	.then(results => {
		barChart(results)
	});

  
function barChart(results) {
    
  console.log('results', results);
  
  const svg = select('svg');

	// + zet stings om in nummers
	const width =+ svg.attr('width');
	const height =+ svg.attr('height');
  
	//basis regels voor de bar chart
	const yValue = result => result.objectCount;
	const xValue = result => result.category;
  const colorContinent = result => result.continent;
  const margin = {top: 10, right: 50, bottom: 300, left: 100};
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
  const tooltip = d3.select('body').append('div').attr('class', 'toolTip');
  
  //code van Laurens uit zijn vizhub wereldkaart: 
  //https://vizhub.com/Razpudding/b42c2072180348658542212b91614b82
  function colorPalette() {
		return d3.scaleOrdinal(d3.schemeSet1)
	};

  const color = colorPalette();
  
	//ticks maken met dezelfde en juiste tussensprongen en waardes
	const yScale = scaleLinear()
  	.domain([0, max(results, yValue)])
  	.range([innerHeight, 0]);

	//per land een bar maken
	const xScale = scaleBand()
  	.domain(results.map(xValue))
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
  		.attr('x', -20)
 	 		.style('fill', 'black')
  		.text('Categoriën')
  		
  //de teksten onder aan rotaten 
  g.call(axisBottom(xScale))
  	.selectAll('.tick text')
  		.attr('y', 20)
  		//35 graden draaien
  		.attr('transform', `rotate(35)`)
  		// de anchor van de teksten staan bij start, dus onder de bar waar ze bijhoren
  		.style('text-anchor', 'start');

  //tekst label van de y as maken en juist neerzetten
	const yAxisGroup = g.append('g')
  	.call(axisLeft(yScale))
		.append('text')
 			.attr('x', -120)
  		.attr('y', -60)
			.style('fill', 'black')
  		.text('Aantal objecten')
			.attr('transform', `rotate(-90)`);
  
	//rechthoeken maken
	g.selectAll('rect').data(results)
  	.enter().append('rect')
  		.attr('class', colorContinent)
      .attr('x', d => xScale(xValue(d)))
      .attr('width', d => xScale.bandwidth())
  		//deze onderste twee regels code van: 
  		//https://codepen.io/bclinkinbeard/pen/aqOLNq?editors=1010 
  		//Dit 'invert' de bars omdat 0 eigenlijk boven is. 
      .attr('y', d => yScale(yValue(d)))
  		.attr('height', d => innerHeight - yScale(yValue(d)))
  		//dit maakt het gestacked omdat ik nu kleuren aan de continenten geef binnen een categorie
  		.style('fill', d => color(colorContinent(d)))
  		.on('mousemove', function(d){
            tooltip
              //zet het in het midden van waar de muis is
              .style('left', d3.event.pageX - 50 + 'px')
              //de hoogte van waar het boven de muis zweeft gerekend vanaf het midden van de popup
              .style('top', d3.event.pageY - 70 + 'px')
              //het moet inline block zijn omdat je er zo width, height, margins en paddings aan kan geven en het neemt geen ruimte in beslag zoals block dat wel doet. 
              .style('display', 'inline-block')
              //tekst in het blokje
              .html((colorContinent(d)) + '<br>' + (yValue(d)) + ' objecten')
        })
    		.on('mouseout', function(d){ tooltip.style('display', 'none');});

  
 d3.selectAll('input').data(results)
  	//.property('checked', checked)
    //.attr('checked', true)
  	.on('change', updateFilter);
  
  //Laurens voor mij geschreven (van function tot d3.selectAll('rect')
	function updateFilter(){
     console.log(this)
     const selectedContinent = this.value
     console.log(selectedContinent)
     console.log(results.filter(row => colorContinent(row) === selectedContinent))
     
     g.selectAll('rect')
     //pakt de rij colorcontinent wat continent is en daarvan matched ie de selecteerde continetn
     	.data(results.filter(row => colorContinent(row) === selectedContinent))
     	.attr('class', colorContinent)
      .attr('x', d => xScale(xValue(d)))
      .attr('width', d => xScale.bandwidth())
      .attr('y', d => yScale(yValue(d)))
  		.attr('height', d => innerHeight - yScale(yValue(d)))
      //hier moet je color aangeven en dan this.value
     	.style('fill', d => color(colorContinent(d)))
     	.exit().remove();
};
  
  //code van: https://www.d3-graph-gallery.com/graph/custom_legend.html
  //legenda namen
  const keys = ['Amerika', 'Azië', 'Afrika', 'Oceanië', 'Eurazië'];
	const size = 20;
  
  //legande kleuren meegeven
  const colorScale = d3.scaleOrdinal()
  	.domain(keys)
  	.range(color);
  
  //legenda vierkanten plaatsen en grootte aangeven
	g.selectAll('legendrectangles')
  	.data(keys)
  	.enter().append('circle')
    	.attr('cx', 0)
  		.attr('r', 6)
  		// 270 is waar de eerste vierkant staat. 25 is de afstand (size(20)+5=25)
    	.attr('cy', function(d,i){ return 280 + i*(size+5)}) 
    	//.attr('width', 100)
    	//.attr('height', size)
    	.style("fill", d => color(d));
  
  // Voegt voor elke vierkant een naam toe (de continenten)
	g.selectAll('mylabels')
  	.data(keys)
  	.enter().append('text')
    	.attr('x', 50)
  		// 275 is waar de eerste vierkant staat. 25 is de afstand (size(20)+5=25)
    //.attr('width', d => xScale.bandwidth())
    	.attr('y', function(d,i){ return 285 + i*(size+5)})
  		//zorgt ervoor dat de kleuren van de tekst overeen komen met de kleuren van het vierkant
    	.style('fill', 'black')
    	.text(d => d)
  		.style('font-size', '1.5em')
}