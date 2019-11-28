(function (d3$1) {
  'use strict';

  //Basis code van https://www.youtube.com/watch?v=NlBt-7PuaLk&list=PL9yYRbwpkykvOXrZumtZWbuaXWHvjD8gi&index=7

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
    ORDER BY DESC(?choCount)`;

  const endpoint = "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-13/sparql";

  //Deze code zo gekregen dankzij Mohamad
  //function is zo geschreven dat het herbruikbaar is. runQuery overschrijft de parameters
  function runQuery(url, query) {
      return fetch(url + "?query=" + encodeURIComponent(query) + "&format=json")
          .then(res => res.json())
          .then(data => data.results.bindings)
        	.then(results => {
        		console.log(results);
          	return results.map(result => {
              return {
  							continent: result.continentLabel.value,
  							category: result.categoryLabel.value,
  							objectCount: Number(result.choCount.value)
              }
          })
      })
          .catch(error => {
              console.log(error);
          })
  }
  runQuery(endpoint, myQuery)
  	.then(results => {
  		barChart(results);
  	});

    
  function barChart(results) {
      
    console.log('results', results);
    
    const svg = d3$1.select('svg');

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
  	}
    const color = colorPalette();
    
  	//ticks maken met dezelfde en juiste tussensprongen en waardes
  	const yScale = d3$1.scaleLinear()
    	.domain([0, d3$1.max(results, yValue)])
    	.range([innerHeight, 0]);

  	//per land een bar maken
  	const xScale = d3$1.scaleBand()
    	.domain(results.map(xValue))
    	.range([0, innerWidth])
  		.padding(0.2);

  	//betere margin maken
  	const g = svg.append('g')
    	.attr('transform', `translate(${margin.left},${margin.top})`);

    
  	const xAxisGroup = g.append('g')
    	.call(d3$1.axisBottom(xScale))
    	//X as onder zetten ipv boven
    	.attr('transform', `translate(0,${innerHeight})`)
  		.append('text') 
    		//tekst onder de as plaatsen
    		.attr('y', 35)
    		//bottom tekst in het midden zetten
    		.attr('x', -20)
   	 		.style('fill', 'black')
    		.text('Categoriën');
    		
    //de teksten onder aan rotaten 
    g.call(d3$1.axisBottom(xScale))
    	.selectAll('.tick text')
    		.attr('y', 20)
    		//35 graden draaien
    		.attr('transform', `rotate(35)`)
    		// de anchor van de teksten staan bij start, dus onder de bar waar ze bijhoren
    		.style('text-anchor', 'start');

    //tekst label van de y as maken en juist neerzetten
  	const yAxisGroup = g.append('g')
    	.call(d3$1.axisLeft(yScale))
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
                .html((colorContinent(d)) + '<br>' + (yValue(d)) + ' objecten');
          })
      		.on('mouseout', function(d){ tooltip.style('display', 'none');});

    
   d3.selectAll('input').data(results)
    	//.property('checked', checked)
      //.attr('checked', true)
    	.on('change', updateFilter);
    
    //Laurens voor mij geschreven (van function tot d3.selectAll('rect')
  	function updateFilter(){
       console.log(this);
       const selectedContinent = this.value;
       console.log(selectedContinent);
       console.log(results.filter(row => colorContinent(row) === selectedContinent));
       
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
  }  
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
    		.style('font-size', '1.5em');
  }

}(d3));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vQmFzaXMgY29kZSB2YW4gaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1ObEJ0LTdQdWFMayZsaXN0PVBMOXlZUmJ3cGt5a3ZPWHJadW10WldidWFYV0h2akQ4Z2kmaW5kZXg9N1xuLy9JayBoZWIgbWVlZ2VzY2hyZXZlbiBlbiB1aXRlaW5kZWxpamsgbWV0IGh1bHAgdmFuIGFuZGVyZSBjb2RlIGRlIGFzc2VuIG9tZ2VkcmFhaXRcblxuLy8gZyBzdGFhdCB2b29yIGdyb3VwXG5cbmltcG9ydCB7IHNlbGVjdCwgXG4gICAgc2NhbGVMaW5lYXIsIFxuICAgIG1heCwgXG4gICAgc2NhbGVCYW5kLFxuICAgIGF4aXNMZWZ0LFxuICAgIGF4aXNCb3R0b20sXG4gIFx0anNvbixcbiAgICBzZWxlY3RBbGwsXG4gICAgYXhpcyxcbiAgICB0aWNrRm9ybWF0XG4gICB9IGZyb20gJ2QzJztcblxuY29uc3QgbXlRdWVyeSA9IGBQUkVGSVggcmRmOiA8aHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIz5cblx0UFJFRklYIGRjOiA8aHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8+XG5cdFBSRUZJWCBkY3Q6IDxodHRwOi8vcHVybC5vcmcvZGMvdGVybXMvPlxuXHRQUkVGSVggc2tvczogPGh0dHA6Ly93d3cudzMub3JnLzIwMDQvMDIvc2tvcy9jb3JlIz5cblx0UFJFRklYIGVkbTogPGh0dHA6Ly93d3cuZXVyb3BlYW5hLmV1L3NjaGVtYXMvZWRtLz5cblx0UFJFRklYIGZvYWY6IDxodHRwOi8veG1sbnMuY29tL2ZvYWYvMC4xLz5cblx0UFJFRklYIGduOiA8aHR0cDovL3d3dy5nZW9uYW1lcy5vcmcvb250b2xvZ3kjPlxuXG4gIFNFTEVDVCA/Y29udGluZW50TGFiZWwgP2NhdGVnb3J5TGFiZWwgKENPVU5UKD9jaG8pIEFTID9jaG9Db3VudCkgXG4gICAgV0hFUkUge1xuICAgICAgICAgPGh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAuNTAwLjExODQwL3Rlcm1tYXN0ZXIyODAyPiBza29zOm5hcnJvd2VyID9jYXRlZ29yeSAuXG4gICAgICAgICA/Y2F0ZWdvcnkgc2tvczpwcmVmTGFiZWwgP2NhdGVnb3J5TGFiZWwgLlxuICAgICAgICAgP2NhdGVnb3J5IHNrb3M6bmFycm93ZXIqID9zdWJjYXRlZ29yeSAuXG5cbiAgICAgICAgICA/Y2hvIGVkbTppc1JlbGF0ZWRUbyA/c3ViY2F0ZWdvcnkgLlxuICAgICAgICAgID9jaG8gZGN0OnNwYXRpYWwgP3BsYWNlIC5cbiAgICAgICAgICA/cGxhY2Ugc2tvczpleGFjdE1hdGNoL2duOmNvdW50cnlDb2RlID9jb3VudHJ5Q29kZSAgLlxuICAgICAgICAgIEZJTFRFUig/Y291bnRyeUNvZGUgIT0gXCJJRFwiKVxuXG4gICAgICAgICAgPGh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAuNTAwLjExODQwL3Rlcm1tYXN0ZXIyPiBza29zOm5hcnJvd2VyID9jb250aW5lbnQgLlxuICAgICAgICAgICA/Y29udGluZW50IHNrb3M6cHJlZkxhYmVsID9jb250aW5lbnRMYWJlbCAuXG4gICAgICAgICAgID9jb250aW5lbnQgc2tvczpuYXJyb3dlciogP3BsYWNlIC5cbiAgICB9IEdST1VQIEJZID9jb250aW5lbnRMYWJlbCA/Y2F0ZWdvcnlMYWJlbFxuICAgIE9SREVSIEJZIERFU0MoP2Nob0NvdW50KWBcblxuY29uc3QgZW5kcG9pbnQgPSBcImh0dHBzOi8vYXBpLmRhdGEubmV0d2Vya2RpZ2l0YWFsZXJmZ29lZC5ubC9kYXRhc2V0cy9pdm8vTk1WVy9zZXJ2aWNlcy9OTVZXLTEzL3NwYXJxbFwiXG5cbi8vRGV6ZSBjb2RlIHpvIGdla3JlZ2VuIGRhbmt6aWogTW9oYW1hZFxuLy9mdW5jdGlvbiBpcyB6byBnZXNjaHJldmVuIGRhdCBoZXQgaGVyYnJ1aWtiYWFyIGlzLiBydW5RdWVyeSBvdmVyc2NocmlqZnQgZGUgcGFyYW1ldGVyc1xuZnVuY3Rpb24gcnVuUXVlcnkodXJsLCBxdWVyeSkge1xuICAgIHJldHVybiBmZXRjaCh1cmwgKyBcIj9xdWVyeT1cIiArIGVuY29kZVVSSUNvbXBvbmVudChxdWVyeSkgKyBcIiZmb3JtYXQ9anNvblwiKVxuICAgICAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcbiAgICAgICAgLnRoZW4oZGF0YSA9PiBkYXRhLnJlc3VsdHMuYmluZGluZ3MpXG4gICAgICBcdC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgXHRcdGNvbnNvbGUubG9nKHJlc3VsdHMpXG4gICAgICAgIFx0cmV0dXJuIHJlc3VsdHMubWFwKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRjb250aW5lbnQ6IHJlc3VsdC5jb250aW5lbnRMYWJlbC52YWx1ZSxcblx0XHRcdFx0XHRcdFx0Y2F0ZWdvcnk6IHJlc3VsdC5jYXRlZ29yeUxhYmVsLnZhbHVlLFxuXHRcdFx0XHRcdFx0XHRvYmplY3RDb3VudDogTnVtYmVyKHJlc3VsdC5jaG9Db3VudC52YWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgICAgIH0pXG59O1xuXG5ydW5RdWVyeShlbmRwb2ludCwgbXlRdWVyeSlcblx0LnRoZW4ocmVzdWx0cyA9PiB7XG5cdFx0YmFyQ2hhcnQocmVzdWx0cylcblx0fSk7XG5cbiAgXG5mdW5jdGlvbiBiYXJDaGFydChyZXN1bHRzKSB7XG4gICAgXG4gIGNvbnNvbGUubG9nKCdyZXN1bHRzJywgcmVzdWx0cyk7XG4gIFxuICBjb25zdCBzdmcgPSBzZWxlY3QoJ3N2ZycpO1xuXG5cdC8vICsgemV0IHN0aW5ncyBvbSBpbiBudW1tZXJzXG5cdGNvbnN0IHdpZHRoID0rIHN2Zy5hdHRyKCd3aWR0aCcpO1xuXHRjb25zdCBoZWlnaHQgPSsgc3ZnLmF0dHIoJ2hlaWdodCcpO1xuICBcblx0Ly9iYXNpcyByZWdlbHMgdm9vciBkZSBiYXIgY2hhcnRcblx0Y29uc3QgeVZhbHVlID0gcmVzdWx0ID0+IHJlc3VsdC5vYmplY3RDb3VudDtcblx0Y29uc3QgeFZhbHVlID0gcmVzdWx0ID0+IHJlc3VsdC5jYXRlZ29yeTtcbiAgY29uc3QgY29sb3JDb250aW5lbnQgPSByZXN1bHQgPT4gcmVzdWx0LmNvbnRpbmVudDtcbiAgY29uc3QgbWFyZ2luID0ge3RvcDogMTAsIHJpZ2h0OiA1MCwgYm90dG9tOiAzMDAsIGxlZnQ6IDEwMH07XG5cdGNvbnN0IGlubmVyV2lkdGggPSB3aWR0aCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0O1xuXHRjb25zdCBpbm5lckhlaWdodCA9IGhlaWdodCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuICBjb25zdCB0b29sdGlwID0gZDMuc2VsZWN0KCdib2R5JykuYXBwZW5kKCdkaXYnKS5hdHRyKCdjbGFzcycsICd0b29sVGlwJyk7XG4gIFxuICAvL2NvZGUgdmFuIExhdXJlbnMgdWl0IHppam4gdml6aHViIHdlcmVsZGthYXJ0OiBcbiAgLy9odHRwczovL3Zpemh1Yi5jb20vUmF6cHVkZGluZy9iNDJjMjA3MjE4MDM0ODY1ODU0MjIxMmI5MTYxNGI4MlxuICBmdW5jdGlvbiBjb2xvclBhbGV0dGUoKSB7XG5cdFx0cmV0dXJuIGQzLnNjYWxlT3JkaW5hbChkMy5zY2hlbWVTZXQxKVxuXHR9O1xuXG4gIGNvbnN0IGNvbG9yID0gY29sb3JQYWxldHRlKCk7XG4gIFxuXHQvL3RpY2tzIG1ha2VuIG1ldCBkZXplbGZkZSBlbiBqdWlzdGUgdHVzc2Vuc3Byb25nZW4gZW4gd2FhcmRlc1xuXHRjb25zdCB5U2NhbGUgPSBzY2FsZUxpbmVhcigpXG4gIFx0LmRvbWFpbihbMCwgbWF4KHJlc3VsdHMsIHlWYWx1ZSldKVxuICBcdC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKTtcblxuXHQvL3BlciBsYW5kIGVlbiBiYXIgbWFrZW5cblx0Y29uc3QgeFNjYWxlID0gc2NhbGVCYW5kKClcbiAgXHQuZG9tYWluKHJlc3VsdHMubWFwKHhWYWx1ZSkpXG4gIFx0LnJhbmdlKFswLCBpbm5lcldpZHRoXSlcblx0XHQucGFkZGluZygwLjIpO1xuXG5cdC8vYmV0ZXJlIG1hcmdpbiBtYWtlblxuXHRjb25zdCBnID0gc3ZnLmFwcGVuZCgnZycpXG4gIFx0LmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHttYXJnaW4ubGVmdH0sJHttYXJnaW4udG9wfSlgKTtcblxuICBcblx0Y29uc3QgeEF4aXNHcm91cCA9IGcuYXBwZW5kKCdnJylcbiAgXHQuY2FsbChheGlzQm90dG9tKHhTY2FsZSkpXG4gIFx0Ly9YIGFzIG9uZGVyIHpldHRlbiBpcHYgYm92ZW5cbiAgXHQuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgwLCR7aW5uZXJIZWlnaHR9KWApXG5cdFx0LmFwcGVuZCgndGV4dCcpIFxuICBcdFx0Ly90ZWtzdCBvbmRlciBkZSBhcyBwbGFhdHNlblxuICBcdFx0LmF0dHIoJ3knLCAzNSlcbiAgXHRcdC8vYm90dG9tIHRla3N0IGluIGhldCBtaWRkZW4gemV0dGVuXG4gIFx0XHQuYXR0cigneCcsIC0yMClcbiBcdCBcdFx0LnN0eWxlKCdmaWxsJywgJ2JsYWNrJylcbiAgXHRcdC50ZXh0KCdDYXRlZ29yacODwqtuJylcbiAgXHRcdFxuICAvL2RlIHRla3N0ZW4gb25kZXIgYWFuIHJvdGF0ZW4gXG4gIGcuY2FsbChheGlzQm90dG9tKHhTY2FsZSkpXG4gIFx0LnNlbGVjdEFsbCgnLnRpY2sgdGV4dCcpXG4gIFx0XHQuYXR0cigneScsIDIwKVxuICBcdFx0Ly8zNSBncmFkZW4gZHJhYWllblxuICBcdFx0LmF0dHIoJ3RyYW5zZm9ybScsIGByb3RhdGUoMzUpYClcbiAgXHRcdC8vIGRlIGFuY2hvciB2YW4gZGUgdGVrc3RlbiBzdGFhbiBiaWogc3RhcnQsIGR1cyBvbmRlciBkZSBiYXIgd2FhciB6ZSBiaWpob3JlblxuICBcdFx0LnN0eWxlKCd0ZXh0LWFuY2hvcicsICdzdGFydCcpO1xuXG4gIC8vdGVrc3QgbGFiZWwgdmFuIGRlIHkgYXMgbWFrZW4gZW4ganVpc3QgbmVlcnpldHRlblxuXHRjb25zdCB5QXhpc0dyb3VwID0gZy5hcHBlbmQoJ2cnKVxuICBcdC5jYWxsKGF4aXNMZWZ0KHlTY2FsZSkpXG5cdFx0LmFwcGVuZCgndGV4dCcpXG4gXHRcdFx0LmF0dHIoJ3gnLCAtMTIwKVxuICBcdFx0LmF0dHIoJ3knLCAtNjApXG5cdFx0XHQuc3R5bGUoJ2ZpbGwnLCAnYmxhY2snKVxuICBcdFx0LnRleHQoJ0FhbnRhbCBvYmplY3RlbicpXG5cdFx0XHQuYXR0cigndHJhbnNmb3JtJywgYHJvdGF0ZSgtOTApYCk7XG4gIFxuXHQvL3JlY2h0aG9la2VuIG1ha2VuXG5cdGcuc2VsZWN0QWxsKCdyZWN0JykuZGF0YShyZXN1bHRzKVxuICBcdC5lbnRlcigpLmFwcGVuZCgncmVjdCcpXG4gIFx0XHQuYXR0cignY2xhc3MnLCBjb2xvckNvbnRpbmVudClcbiAgICAgIC5hdHRyKCd4JywgZCA9PiB4U2NhbGUoeFZhbHVlKGQpKSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGQgPT4geFNjYWxlLmJhbmR3aWR0aCgpKVxuICBcdFx0Ly9kZXplIG9uZGVyc3RlIHR3ZWUgcmVnZWxzIGNvZGUgdmFuOiBcbiAgXHRcdC8vaHR0cHM6Ly9jb2RlcGVuLmlvL2JjbGlua2luYmVhcmQvcGVuL2FxT0xOcT9lZGl0b3JzPTEwMTAgXG4gIFx0XHQvL0RpdCAnaW52ZXJ0JyBkZSBiYXJzIG9tZGF0IDAgZWlnZW5saWprIGJvdmVuIGlzLiBcbiAgICAgIC5hdHRyKCd5JywgZCA9PiB5U2NhbGUoeVZhbHVlKGQpKSlcbiAgXHRcdC5hdHRyKCdoZWlnaHQnLCBkID0+IGlubmVySGVpZ2h0IC0geVNjYWxlKHlWYWx1ZShkKSkpXG4gIFx0XHQvL2RpdCBtYWFrdCBoZXQgZ2VzdGFja2VkIG9tZGF0IGlrIG51IGtsZXVyZW4gYWFuIGRlIGNvbnRpbmVudGVuIGdlZWYgYmlubmVuIGVlbiBjYXRlZ29yaWVcbiAgXHRcdC5zdHlsZSgnZmlsbCcsIGQgPT4gY29sb3IoY29sb3JDb250aW5lbnQoZCkpKVxuICBcdFx0Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAgICAgLy96ZXQgaGV0IGluIGhldCBtaWRkZW4gdmFuIHdhYXIgZGUgbXVpcyBpc1xuICAgICAgICAgICAgICAuc3R5bGUoJ2xlZnQnLCBkMy5ldmVudC5wYWdlWCAtIDUwICsgJ3B4JylcbiAgICAgICAgICAgICAgLy9kZSBob29ndGUgdmFuIHdhYXIgaGV0IGJvdmVuIGRlIG11aXMgendlZWZ0IGdlcmVrZW5kIHZhbmFmIGhldCBtaWRkZW4gdmFuIGRlIHBvcHVwXG4gICAgICAgICAgICAgIC5zdHlsZSgndG9wJywgZDMuZXZlbnQucGFnZVkgLSA3MCArICdweCcpXG4gICAgICAgICAgICAgIC8vaGV0IG1vZXQgaW5saW5lIGJsb2NrIHppam4gb21kYXQgamUgZXIgem8gd2lkdGgsIGhlaWdodCwgbWFyZ2lucyBlbiBwYWRkaW5ncyBhYW4ga2FuIGdldmVuIGVuIGhldCBuZWVtdCBnZWVuIHJ1aW10ZSBpbiBiZXNsYWcgem9hbHMgYmxvY2sgZGF0IHdlbCBkb2V0LiBcbiAgICAgICAgICAgICAgLnN0eWxlKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpXG4gICAgICAgICAgICAgIC8vdGVrc3QgaW4gaGV0IGJsb2tqZVxuICAgICAgICAgICAgICAuaHRtbCgoY29sb3JDb250aW5lbnQoZCkpICsgJzxicj4nICsgKHlWYWx1ZShkKSkgKyAnIG9iamVjdGVuJylcbiAgICAgICAgfSlcbiAgICBcdFx0Lm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uKGQpeyB0b29sdGlwLnN0eWxlKCdkaXNwbGF5JywgJ25vbmUnKTt9KTtcblxuICBcbiBkMy5zZWxlY3RBbGwoJ2lucHV0JykuZGF0YShyZXN1bHRzKVxuICBcdC8vLnByb3BlcnR5KCdjaGVja2VkJywgY2hlY2tlZClcbiAgICAvLy5hdHRyKCdjaGVja2VkJywgdHJ1ZSlcbiAgXHQub24oJ2NoYW5nZScsIHVwZGF0ZUZpbHRlcik7XG4gIFxuICAvL0xhdXJlbnMgdm9vciBtaWogZ2VzY2hyZXZlbiAodmFuIGZ1bmN0aW9uIHRvdCBkMy5zZWxlY3RBbGwoJ3JlY3QnKVxuXHRmdW5jdGlvbiB1cGRhdGVGaWx0ZXIoKXtcbiAgICAgY29uc29sZS5sb2codGhpcylcbiAgICAgY29uc3Qgc2VsZWN0ZWRDb250aW5lbnQgPSB0aGlzLnZhbHVlXG4gICAgIGNvbnNvbGUubG9nKHNlbGVjdGVkQ29udGluZW50KVxuICAgICBjb25zb2xlLmxvZyhyZXN1bHRzLmZpbHRlcihyb3cgPT4gY29sb3JDb250aW5lbnQocm93KSA9PT0gc2VsZWN0ZWRDb250aW5lbnQpKVxuICAgICBcbiAgICAgZy5zZWxlY3RBbGwoJ3JlY3QnKVxuICAgICAvL3Bha3QgZGUgcmlqIGNvbG9yY29udGluZW50IHdhdCBjb250aW5lbnQgaXMgZW4gZGFhcnZhbiBtYXRjaGVkIGllIGRlIHNlbGVjdGVlcmRlIGNvbnRpbmV0blxuICAgICBcdC5kYXRhKHJlc3VsdHMuZmlsdGVyKHJvdyA9PiBjb2xvckNvbnRpbmVudChyb3cpID09PSBzZWxlY3RlZENvbnRpbmVudCkpXG4gICAgIFx0LmF0dHIoJ2NsYXNzJywgY29sb3JDb250aW5lbnQpXG4gICAgICAuYXR0cigneCcsIGQgPT4geFNjYWxlKHhWYWx1ZShkKSkpXG4gICAgICAuYXR0cignd2lkdGgnLCBkID0+IHhTY2FsZS5iYW5kd2lkdGgoKSlcbiAgICAgIC5hdHRyKCd5JywgZCA9PiB5U2NhbGUoeVZhbHVlKGQpKSlcbiAgXHRcdC5hdHRyKCdoZWlnaHQnLCBkID0+IGlubmVySGVpZ2h0IC0geVNjYWxlKHlWYWx1ZShkKSkpXG4gICAgICAvL2hpZXIgbW9ldCBqZSBjb2xvciBhYW5nZXZlbiBlbiBkYW4gdGhpcy52YWx1ZVxuICAgICBcdC5zdHlsZSgnZmlsbCcsIGQgPT4gY29sb3IoY29sb3JDb250aW5lbnQoZCkpKVxuICAgICBcdC5leGl0KCkucmVtb3ZlKCk7XG59O1xuICBcbiAgLy9jb2RlIHZhbjogaHR0cHM6Ly93d3cuZDMtZ3JhcGgtZ2FsbGVyeS5jb20vZ3JhcGgvY3VzdG9tX2xlZ2VuZC5odG1sXG4gIC8vbGVnZW5kYSBuYW1lblxuICBjb25zdCBrZXlzID0gWydBbWVyaWthJywgJ0F6acODwqsnLCAnQWZyaWthJywgJ09jZWFuacODwqsnLCAnRXVyYXppw4PCqyddO1xuXHRjb25zdCBzaXplID0gMjA7XG4gIFxuICAvL2xlZ2FuZGUga2xldXJlbiBtZWVnZXZlblxuICBjb25zdCBjb2xvclNjYWxlID0gZDMuc2NhbGVPcmRpbmFsKClcbiAgXHQuZG9tYWluKGtleXMpXG4gIFx0LnJhbmdlKGNvbG9yKTtcbiAgXG4gIC8vbGVnZW5kYSB2aWVya2FudGVuIHBsYWF0c2VuIGVuIGdyb290dGUgYWFuZ2V2ZW5cblx0Zy5zZWxlY3RBbGwoJ2xlZ2VuZHJlY3RhbmdsZXMnKVxuICBcdC5kYXRhKGtleXMpXG4gIFx0LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgIFx0LmF0dHIoJ2N4JywgMClcbiAgXHRcdC5hdHRyKCdyJywgNilcbiAgXHRcdC8vIDI3MCBpcyB3YWFyIGRlIGVlcnN0ZSB2aWVya2FudCBzdGFhdC4gMjUgaXMgZGUgYWZzdGFuZCAoc2l6ZSgyMCkrNT0yNSlcbiAgICBcdC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQsaSl7IHJldHVybiAyODAgKyBpKihzaXplKzUpfSkgXG4gICAgXHQvLy5hdHRyKCd3aWR0aCcsIDEwMClcbiAgICBcdC8vLmF0dHIoJ2hlaWdodCcsIHNpemUpXG4gICAgXHQuc3R5bGUoXCJmaWxsXCIsIGQgPT4gY29sb3IoZCkpO1xuICBcbiAgLy8gVm9lZ3Qgdm9vciBlbGtlIHZpZXJrYW50IGVlbiBuYWFtIHRvZSAoZGUgY29udGluZW50ZW4pXG5cdGcuc2VsZWN0QWxsKCdteWxhYmVscycpXG4gIFx0LmRhdGEoa2V5cylcbiAgXHQuZW50ZXIoKS5hcHBlbmQoJ3RleHQnKVxuICAgIFx0LmF0dHIoJ3gnLCA1MClcbiAgXHRcdC8vIDI3NSBpcyB3YWFyIGRlIGVlcnN0ZSB2aWVya2FudCBzdGFhdC4gMjUgaXMgZGUgYWZzdGFuZCAoc2l6ZSgyMCkrNT0yNSlcbiAgICAvLy5hdHRyKCd3aWR0aCcsIGQgPT4geFNjYWxlLmJhbmR3aWR0aCgpKVxuICAgIFx0LmF0dHIoJ3knLCBmdW5jdGlvbihkLGkpeyByZXR1cm4gMjg1ICsgaSooc2l6ZSs1KX0pXG4gIFx0XHQvL3pvcmd0IGVydm9vciBkYXQgZGUga2xldXJlbiB2YW4gZGUgdGVrc3Qgb3ZlcmVlbiBrb21lbiBtZXQgZGUga2xldXJlbiB2YW4gaGV0IHZpZXJrYW50XG4gICAgXHQuc3R5bGUoJ2ZpbGwnLCAnYmxhY2snKVxuICAgIFx0LnRleHQoZCA9PiBkKVxuICBcdFx0LnN0eWxlKCdmb250LXNpemUnLCAnMS41ZW0nKVxufTtcblxuXG4iXSwibmFtZXMiOlsic2VsZWN0Iiwic2NhbGVMaW5lYXIiLCJtYXgiLCJzY2FsZUJhbmQiLCJheGlzQm90dG9tIiwiYXhpc0xlZnQiXSwibWFwcGluZ3MiOiI7OztFQUFBOztFQWlCQSxNQUFNLE9BQU8sR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkF1QlcsRUFBQzs7RUFFN0IsTUFBTSxRQUFRLEdBQUcsdUZBQXNGOzs7O0VBSXZHLFNBQVMsUUFBUSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7TUFDMUIsT0FBTyxLQUFLLENBQUMsR0FBRyxHQUFHLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxjQUFjLENBQUM7V0FDckUsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7V0FDdkIsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztVQUNwQyxJQUFJLENBQUMsT0FBTyxJQUFJO1VBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFDO1dB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