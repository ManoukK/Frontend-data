# De collectie van wereld culturen zonder Indonesië

## Opdracht
De opdracht is om een visualisatie in d3 te maken en daarbij interactie toe te passen aan de hand van een update pattern. Voor deze opdracht kan je de visualisatie gebruiken die je eerder hebt gemaakt, in functional programming. De visualisatie moet weer data bevatten uit de dataset van het tropen museum. Wat opgehaald moet worden via een query.

## Leerdoelen 
- In d3 werken
- Interactie toevoegen door een update pattern te schrijven
- Goede data visualisatie maken die iedereen kan begrijpen, ook zonder uitleg

Wil je mijn enter, update, exit pattern lezen, dan kan je dat hier in mijn wiki doen. Ik leg hier ook uit wat enter, update en exit is. 
https://github.com/ManoukK/Frontend-data/wiki/Enter,-exit,-update-in-D3

## Concept
Mijn doelgroep voor mijn concept zijn de medewerkers van het tropen museum. Vooral de mensen die tentoonstellingen maken, over de collectie gaan ect. Met mijn concept wil ik laten zien hoe de collectie is zonder Indonesië. De collectie is ontstaan uit dit land en er zijn ontzettend veel objecten en foto's die daar vandaan komen. De mensen die over de collectie gaan hebben al een goed beeld van Indonesië. Nu wil ik laten zien hoe de collectie zonder Indonesië is. Op deze manier hoop ik het perspectief te veranderen van de medewerkers en dat ze op een andere manier naar de collectie kijken en op nieuwe inzichten komen. 

#### Voorbeeld voor mijn idee
<img width="752" alt="grouped-column-chart-reference-small" src="https://user-images.githubusercontent.com/45541885/69614404-5bef3000-1033-11ea-8286-dc2d73a18ca6.png">
Bron: https://docs.mongodb.com/charts/master/chart-type-reference/column-bar-chart/

Ik wil zoiets gaan maken. De kleuren worden de continenten (zonder Indonesië) en de groepen waar de bars in staan worden de categoriën. Als interactie wil ik dat je de continenten aan en uit kan zetten zodat je het een van het ander kan vergelijken. 

#### Mijn eindresultaat op donderdag 28/11/19 13:00
[![Schermafbeelding 2019-11-28 om 12 19 44](https://user-images.githubusercontent.com/45541885/69802260-7a8f2b80-11d9-11ea-91c2-f2ff72ece060.png)](https://vizhub.com/ManoukK/c5757c39fd744066aa64668b02a92785?mode=full)

## Installatie
De template die ik heb gebruikt komt van dit filmpje af: https://www.youtube.com/watch?v=NlBt-7PuaLk&list=PL9yYRbwpkykvOXrZumtZWbuaXWHvjD8gi&index=7 Mocht je de basis code willen schrijven dan moet je het filmpje bekijken. Helaas is hier geen code meer van wat je kan kopiëren. 

Als je mijn code wilt gebruiken kan je mijn code forken en/of downloaden in Github. Het is belangrijk dat je de bundle.js mee neemt in je fork of download. Ik heb mijn code geschreven in vizhub en hier word gebruik gemaakt van de bundle.js. Het is een javascript bestandje die de code die je in de andere .js bestanden schrijft update en vertaald zodat je de visualisaties te zien krijgt in de browser. 

Om gebruik te maken van d3 is het belangrijk dat je in je head in html deze regel zet. Dit zorgt ervoor dat d3 gedownload word. 
```html
<script src="https://unpkg.com/d3@5.6.0/dist/d3.min.js"></script>
```
Vervolgens moet je in je javascript index ook vertellen welke onderdelen van d3 je wilt gebruiken. Dat doe je met deze regel. Als je dingen niet gebruik of als je iets wilt toevoegen kan je de lijst aanpassen. 
```javascript
import { select, 
    scaleLinear, 
    max, 
    scaleBand,
    axisLeft,
    axisBottom,
  	json,
   } from 'd3';
```

## Data 
Ik heb gebruik gemaakt van de collectie van wereld culturen. De collectie heeft een ontzettend grootte database. De data kan je ophalen aan de hand van een sparql. Dankzij Ivo is dat mij gelukt. Ik haal alle object en foto's op uit de dataset die een continent en een categorie hebben toe gewezen. Dankzij deze regel word Indonesië in de sparql er al uit gefilterd. Ik heb hier bewust voor gekozen omdat ik juist de collectie wil tonen zonder Indonesië

```sparql
FILTER(?countryCode != "ID")
```

Dit is de sparql die ik heb gebruikt. De prefixes zijn nodig om benodigde data op te halen, om errors te voorkomen en om dingen te definiëren.
```sparql
`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
```
De endpoint die ik heb gebruikt ziet er zo uit: 
```
https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-13/sparql
```
De data die ik binnen kreeg was een array met values erin die ik uiteindelijk naar voren wil halen, deze zitten nogal verstopt. Ik heb de array een klein beetje opgeschoont maar het is meer netter maken dan opschonen. Zo zag de array er eerst uit:

![Schermafbeelding 2019-11-26 om 10 50 21](https://user-images.githubusercontent.com/45541885/69618756-b3dd6500-103a-11ea-9d8e-7f4f9f807abc.png)

Dit is de code waar ik mijn data ophaal, fetch, omzet naar json en netter maak. Dankzij de return die ik gebruik bij continent, category en objectCount krijg ik de array terug die je hieronder kan zien. De objectCount heeft een nummer waarde alleen ziet het nog als een string. Door er Number voor te zetten returnt het nummers in plaats van strings. 

```javascript
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
```

Zo ziet de array eruit waar ik mee verder heb gewerkt. 

![Schermafbeelding 2019-11-26 om 10 50 47](https://user-images.githubusercontent.com/45541885/69619368-c015f200-103b-11ea-88c3-acbadd244ee8.png)

#### Lege data
In mijn visualisatie heb ik eigenlijk geen "lege" data maar wel data die erg minimaal zijn. Een goed voorbeeld is Eurazië, die zie je bijna niet in mijn grafiek tenzij je erop gaat filteren. Toch wilde ik dit er wel in houden omdat het wel veel zegt over de collectie. Het mooie is dat als mensen dit niet willen zien hebben zij zelf de keuze om het eruit te filteren. 

## Features
- [ ] Een grouped bar chart in d3
- [x] Filteren op continent
- [ ] Y as die mee beweegt op de filter 
- [x] Pop-up met aantal objecten in een bar via tooltips

## Proces
Mijn proces naar het eind resultaat heb ik duidelijk beschreven in mijn wiki. Dit kan je hier lezen: [wiki, visualisatie maken in d3 (proces)](https://github.com/ManoukK/Frontend-data/wiki/Visualisatie-maken-in-D3-(proces)) Ik wilde toch even kort laten zien waar ik ben begonnen en wat het uiteindelijk is geworden. Ik heb ook gebruik gemaakt van een update pattern. Deze heb ik even los in een andere wiki beschreven dan bij het proces. Als je daar meer over wilt lezen kan je dat hier doen: [wiki, enter exit en update in d3](https://github.com/ManoukK/Frontend-data/wiki/Enter,-exit,-update-in-D3)

Dit heb ik als eerste gemaakt aan de hand van het filmpje van Curran: https://www.youtube.com/watch?v=NlBt-7PuaLk&list=PL9yYRbwpkykvOXrZumtZWbuaXWHvjD8gi&index=7
![Schermafbeelding 2019-11-22 om 14 01 31](https://user-images.githubusercontent.com/45541885/69430245-6b216580-0d35-11ea-8f9b-a6eb6b7c2a39.png)

Uiteindelijk heb ik dit ervan gemaakt: 
![Schermafbeelding 2019-11-26 om 11 26 18](https://user-images.githubusercontent.com/45541885/69621607-b8584c80-103f-11ea-99bc-f2aa40c443b0.png)

## Bronnenlijst 
- basis code: https://www.youtube.com/watch?v=NlBt-7PuaLk&list=PL9yYRbwpkykvOXrZumtZWbuaXWHvjD8gi&index=7
- Legenda: https://www.d3-graph-gallery.com/graph/custom_legend.html
- Update pattern basis: Laurens Aarnoudse
- Kleuren toevoegen: https://vizhub.com/Razpudding/b42c2072180348658542212b91614b82
- Labels laten draaien: https://bl.ocks.org/mbostock/4403522

## Credits voor:
#### non-code:
- Kim die mij wat kleine handige tips gaf tijdens het bedenken van mijn concept. 
- Laurens die mij vertelde dat het juist misschien interessant is om Indonesië eruit te laten.

#### code:
- Laurens die de basis voor mijn update pattern heeft geschreven. 
- Ivo die mij heeft geholpen bij het schrijven van een sparql.
- Robert en Kris die met mij mee dachten voor mijn update pattern, ookal was het helaas niet gelukt. 
- Kim voor het idee om van de checkboxes radio buttons te maken als mijn update pattern idee niet zou werken. 
- Joan die hetzelfde update pattern probleem had als mij en met mij veel ging brainstormen hoe we het konden oplossen.
- Wiebe van hem heb ik de link naar een goede tooltip gekregen.
