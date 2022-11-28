var margin = {top: 10, right: 10, bottom: 100, left: 40};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
var projection = d3.geoNaturalEarth1()
                   .center([0, 15]) 
                   .rotate([-9,0])
                   .scale([1300/(2*Math.PI)]) 
                   .translate([450,300]);
var path = d3.geoPath()
             .projection(projection);
var svg = d3.select("svg")
            .classed("svg-container", true)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 960 800")
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("width", width)
            .attr("height", height);
var bar = d3.select("#bar")
            .classed("svg-container", true)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 960 500")
            .classed("svg-content-responsive", true)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var tooltip = d3.select("div.tooltip");

var fillColor = d3.scaleThreshold()
    .domain([10,100,250,500,1000,2500,5000,10000])
    .range(d3.schemeYlOrRd[9]);
var barColors = d3.scaleOrdinal(d3.schemeCategory10);
var Year = 2010;

//    /\                      |\**/|      
//   /  \                     \ == /
//   |  |                      |  |
//   |  |      Main Code       |  |
//  / == \                     \  /
//  |/**\|                      \/

d3.queue()
  .defer(d3.json, "world-atlas.json")
  .defer(d3.csv, "world-country-names.csv")
  .defer(d3.csv, "armSalesData.csv")
  .await(ready);


function ready(error, world, names, tiv) {
  if (error) throw error;
  var countries1 = topojson.feature(world, world.objects.countries).features;
    countries = countries1.filter(function(d) {
    return names.some(function(n) {
      if (d.id == n.id) 
          return d.name = n.name;   
    })});
    
    countries.map(function (d) {
        names.filter(function (n) {
          if (d.id == n.id) {
            return (d.region = n.region);
          }
        tiv.filter(function(t){
          if (d.name == t.country){
            (d.current = t.twentytens);
            (d.twentytens = t.twentytens);
            (d.twothousands = t.twothousands);
            (d.nineties = t.nineties);
            (d.eighties = t.eighties);
            (d.seventies = t.seventies);
            (d.sixties = t.sixties);
            (d.fifties = t.fifties);
          }
        })
        });
      });
     map = svg.selectAll("path")
			.data(countries)
			.enter()
			.append("path")
			.attr("stroke","black")
			.attr("stroke-width",0.65)
            .attr("fill", hoverColorChange)
			.attr("d", path)
            .on("mousemove",showTooltip)
			.on("mouseover",hoverColorChange)
            .on("mouseout", removeTooltip);


    /*
    
    - | | 
    - | |       | |
    - | |       | |
    - | |  | |  | |     BAR GRAPH
    - | |  | |  | |
    i i i i i i i i i
    */
    
    //console.log(tiv);
    var dec = ["fifties", "sixties", "seventies", "eighties", "nineties", "twothousands", "twentytens"]; //Each decade represented in tiv data
    var decades = [{fifties: []}, {sixties: []}, {seventies: []}, {eighties: []}, {nineties: []}, {twothousands: []}, {twentytens: []}]; //Organized dataset
    tiv.map(function(country) {
        //console.log(country);
        for (var x = 0; x < dec.length; x++) {
            var pair = {country: country.country,
                        tiv: country[dec[x]]};
            decades[x][dec[x]].push(pair);
        }
    })
    //console.log(decades);
    for (var x = 0; x < dec.length; x++) { //Sorts each decade, least to most
        decades[x][dec[x]] = decades[x][dec[x]].sort(function (a,b) {
            return a.tiv - b.tiv;
        })
    }
    var chosen = 6; //Index for the current decade
    var top10 = []; //Empty array for top 10 countries from each decade
    for (var x = 0; x < dec.length; x++) { //Gets top 10 countries from each decade
        top10.push(decades[x][dec[x]].slice(161, 171));
    }
    
    d3.select("#dec0").on("click", update);
    d3.select("#dec1").on("click", update);
    d3.select("#dec2").on("click", update);
    d3.select("#dec3").on("click", update);
    d3.select("#dec4").on("click", update);
    d3.select("#dec5").on("click", update);
    d3.select("#dec6").on("click", update);
    
    update();
    function update() {
        if (this.value === "1950s") {
            chosen = 0;
        }
        if (this.value === "1960s") {
            chosen = 1;
        }
        if (this.value === "1970s") {
            chosen = 2;
        }
        if (this.value === "1980s") {
            chosen = 3;
        }
        if (this.value === "1990s") {
            chosen = 4;
        }
        if (this.value === "2000s") {
            chosen = 5;
        }
        if (this.value === "2010s") {
            chosen = 6;
        }
        updateMap(chosen);
        bar.selectAll("rect").remove();
        bar.selectAll("g.myXaxis").remove();
        bar.selectAll("g.myYaxis").remove();
        
        var x = d3.scaleBand() //x axis
        .range([0,width])
        .domain(top10[chosen].map(function(decade) {
            return decade.country;
        }))
        .padding(0.2);

        bar.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "myXaxis")
            .call(d3.axisBottom(x))
            .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end")
                .attr("font-size" , "13px");
        topval = top10[chosen].map(function (country) { 
            return parseInt(country.tiv);    
        });
        //console.log(topval);
        var y = d3.scaleLinear()
            .domain([0, Math.max(...topval)])
            .range([height, 0])
        bar.append("g")
            .attr("class", "myYaxis")
            .call(d3.axisLeft(y));

            bar.selectAll("rect")
            .data(top10[chosen])
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.country); })
            .attr("y", function(d) { return y(parseInt(d.tiv)); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d.tiv); })
            .style("fill", function (d) {
                return barColors(d.country);
            })
            .on("mousemove",showTooltipBar)
            .on("mouseout", function(d) {return tooltip.classed("hidden", true);});
        }
    //console.log(decades);
    //console.log(top10);
    var x = d3.scaleBand() //x axis
        .range([0,width])
        .domain(top10[chosen].map(function(decade) {
            return decade.country;
        }))
        .padding(0.2);

    bar.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "myXaxis")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end")
            .attr("font-size" , "13px");
    topval = top10[chosen].map(function (country) { 
        return parseInt(country.tiv);    
    });
    //console.log(topval);
    var y = d3.scaleLinear()
        .domain([0, Math.max(...topval)])
        .range([height, 0])
    bar.append("g")
        .attr("class", "myYaxis")
        .call(d3.axisLeft(y));
    
    //console.log(top10[chosen]);
    
    bar.selectAll("rect")
        .data(top10[chosen])
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.country); })
        .attr("y", function(d) { return y(parseInt(d.tiv)); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.tiv); })
        .style("fill", function (d) {
            return barColors(d.country);
        });
    
};

//    /\                      |\**/|      
//   /  \                     \ == /
//   |  |                      |  |
//   |  |   Helper Functions   |  |
//  / == \                     \  /
//  |/**\|                      \/

function updateMap(chosen){
        countries.map(function (d) {
        if (chosen === 0) {
            Year = 1950;
            d.current = d.fifties;
        }
        if (chosen === 1) {
            Year = 1960;
            d.current = d.sixties;
        }
        if (chosen === 2) {
            Year = 1970;
            d.current = d.seventies;
        }
        if (chosen === 3) {
            Year = 1980;
            d.current = d.eighties;
        }
        if (chosen === 4) {
            Year = 1990;
            d.current = d.nineties;
        }
        if (chosen === 5) {
            Year = 2000;
            d.current = d.twothousands;
        }
        if (chosen === 6) {
            Year = 2010;
            d.current = d.twentytens;
        }
        map
            .attr("fill", hoverColorChange)
            .on("mousemove",showTooltip)
			.on("mouseover",hoverColorChange)
            .on("mouseout", removeTooltip);
        });
}

function hoverColorChange(d){
    if (typeof d.current == 'undefined'){
        d.current = "0"
    }
    if (d.name == "United States of America"){
        return "lightskyblue";
    }
    if (d.current == 0){
         d3.select(this).attr("opacity",0.35)
            return "grey";
        }
    else{
        d3.select(this).attr("opacity",1)
    }
    return fillColor(d.current); 
};


function showTooltip(d){
    values = getRegionColor(d.region);
    tableColor = values[0]
    borderColor = values[1]
    //console.log(d);
    tooltipText = "<table style='background-color:"+
        tableColor+
        "';>"+
        //Country Name Row
        "<tr><th>"+
        d.name+
        "</th></tr>"+
        //Country Region Row
        "<tr><td>Region: "+
        d.region+
        "</td></tr>"+
        //Decade Row
        "<tr><td>Time Period: " + Year +"s</td></tr>";
    if(d.name != "United States of America"){
        tooltipText +=
        //Country TIV row
        "<tr><td>Trade Indicator Value: "+
        d.current+
        "</tr></td>"
    }
    tooltipText += "</table>"
    
    if (typeof d.current == 'undefined'){
        d.current = "0"
    }
    tooltip.classed("hidden", false)
        .style("top", (d3.event.pageY) + "px")
        .style("left", (d3.event.pageX + 10) + "px")
        .style("background", borderColor)
        .html(tooltipText);
}

function showTooltipBar(d){
    //console.log(d);
    tooltipText = "<table style='background-color:"+
        "palegreen"+
        "';>"+
        //Country Name Row
        "<tr><th>"+
        d.country+
        "</th></tr>"+
        //Country Region Row
        "<tr><td>Trade Indicator Value: "+
        d.tiv+
        "</td></tr>";
    tooltipText += "</table>"
    tooltip.classed("hidden", false)
        .style("top", (d3.event.pageY) + "px")
        .style("left", (d3.event.pageX + 10) + "px")
        .html(tooltipText);
}

function removeTooltip(d){
    //console.log(d.current);
    d3.select(this).attr("fill",hoverColorChange).attr("stroke-width",0.65).attr("opacity",1);
    if (d.current == 0 ){
        d3.select(this).attr("opacity",0.35);
    }
    tooltip.classed("hidden", true);
}
function getRegionColor (countryRegion){
    switch (countryRegion) {
        case "North America":
            return ["silver","slategray"]
            break;
        case "South America":
            return ["paleGreen","lightGreen"]
            break;
        case "Africa":
            return ["yellow","gold"]
            break;
        case "Europe":
            return ["paleturquoise","lightcyan"]
            break;
        case "Asia":
            return ["palegoldenrod","goldenrod"]
            break;
        case "Middle East":
            return ["lightpink","indianred"]
            break;
        case "Oceania":
            return ["violet","hotpink"]
            break;
        default:
            return ["white","black"]

    }
};