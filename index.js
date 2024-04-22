// ------------------------- SELECT HTML ELEMENTS -------------------------- //

// select element, will contain year/month data
let monthDropdown = d3.select("#monthDropdown");

// select element for centrality drowdown
let centralityDrowdown = d3.select("#centralitySelect");

// select element for how to color the counties
let colorDropdown = d3.select("#colorDropdown");

// SVG element, will contain counties, airports, flight paths, state/nation boundaries
let svg = d3.select("#svg");

// g element, will contain county borders
let counties = svg.select("#counties");

// g element, will contain circles representing airports
let airports = svg.select("#airports");

// g element, will contain flight paths, when an airport is hovered over
let flightPaths = svg.select("#flightPaths");

// text element, will show information about a county / airport on click
let panelText = d3.select("#panelText");

// g element, will show legend information
let legend = d3.select("#legend");

// -------------------------------- TOOLTIP -------------------------------- //

function tooltipText(name, id) {
  return name; // no need for id, concatenated in line 149 instead
}

function airportTooltipText(id, airportObject, centralityMonth) {
  // Start with the airport's name in bold
  let tooltipText = "<strong>" + airportObject[id]["name"] + "</strong><br>";

  // Add centrality measures to the tooltip text with HTML line breaks and small text size
  tooltipText +=
    "<span style='font-size: small;'>Authority Score: " +
    centralityMonth["Authority Score"].toFixed(2) +
    "</span><br>";
  tooltipText +=
    "<span style='font-size: small;'>Eccentricity: " +
    centralityMonth["Eccentricity"].toFixed(2) +
    "</span><br>";
  tooltipText +=
    "<span style='font-size: small;'>Eigenvector Centrality: " +
    centralityMonth["Eigenvector Centrality"].toFixed(2) +
    "</span><br>";
  tooltipText +=
    "<span style='font-size: small;'>Harmonic Centrality: " +
    centralityMonth["Harmonic Centrality"].toFixed(2) +
    "</span><br>";
  tooltipText +=
    "<span style='font-size: small;'>Hub Score: " +
    centralityMonth["Hub Score"].toFixed(2) +
    "</span><br>";
  tooltipText +=
    "<span style='font-size: small;'>Page Rank: " +
    centralityMonth["PageRank"].toFixed(2) +
    "</span>";

  // Log and return the tooltip text
  console.log(tooltipText);
  return tooltipText;
}

let tooltip = d3
  .tip()
  .attr("id", "tooltip")
  .attr("class", "d3-tip")
  .html(tooltipText);

let airportTooltip = d3
  .tip()
  .attr("class", "d3-tip")
  .style("opacity", "0.8")
  .offset([-10, 0])
  .html(airportTooltipText);

svg.call(tooltip);
svg.call(airportTooltip);

// ------------------------------ COLOR SCALES ------------------------------ //

// Given case data per capita, how do we want to color the county?
let colorScale = d3.scalePow().exponent(0.25).range(["#90EE90", "#800026"]);

// Given centrality data, what size do we want to make the airport node?
let radiusScale = d3.scaleLinear().range([1, 10]);

// Given infection estimates on outgoing flights, how do we want to change
// the weights of the edges?
let flightWeightScale = d3.scalePow().exponent(0.3).range([1, 5]);

// ------------------------------ PROJECTION ------------------------------ //

// Function used to turn geographic coordinates into 2d pixel locations
let projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);

// Path generator used to plot the GeoJSON data
let path = d3.geoPath().projection(projection);

// --------------------------- HELPER FUNCTIONS --------------------------- //

// Description: Draws the map. This function is only called once. See
// colorCounties() and drawAirports() to do the things the function names
// say they're going to do.
//
// params:
// us: geoJSON data of outlines of US counties, states, and the nation
function drawOutlines(us) {
  // Draw county borders
  svg
    .append("path")
    .attr("class", "county-borders")
    .attr(
      "d",
      path(
        topojson.mesh(us, us.objects.counties, function (a, b) {
          return a !== b;
        })
      )
    )
    .attr("stroke", "#3d3d3d")
    .attr("stroke-width", "0.5")
    .style("fill", "none")
    .style("pointer-events", "none");

  // Draw state borders
  svg
    .append("path")
    .attr("class", "state-borders")
    .attr(
      "d",
      path(
        topojson.mesh(us, us.objects.states, function (a, b) {
          return a !== b;
        })
      )
    )
    .attr("stroke", "#000000")
    .attr("stroke-width", "1")
    .style("fill", "none")
    .style("pointer-events", "none");

  // Draw national border
  svg
    .append("path")
    .attr("class", "national-border")
    .attr("d", path(topojson.feature(us, us.objects.nation)))
    .attr("stroke", "#000000")
    .attr("stroke-width", "1")
    .style("fill", "none")
    .style("pointer-events", "none");
}

// Description: Given the geographical data and case density data for some month,
// colors in each county according to the case density.
//
// params:
// us: geoJSON data of outlines of US counties, states, and the nation
// monthData: case density in each county for a given month
function colorCounties(
  us,
  caseData,
  riskData,
  month,
  year,
  countyColor,
  centrality
) {
  counties.selectAll("*").remove();

  if (countyColor == "Case Data") {
    d3.select(".county-borders").style("visibility", "visible");
    let monthData = caseData[month + "/" + year + " cases per 100k"];
    // remove all counties
    // console.log("Month data: ", monthData);  // Debugging statement here
    // adjust the color scale to the min and max of the case density data
    colorScale.domain([0, d3.max(Object.values(monthData))]);

    // color all counties
    let activeCountyId = null; // store currently active county ID

    counties
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", (d) => colorScale(monthData[parseInt(d.id)]))
      .attr("id", (d) => parseInt(d.id))
      .attr("name", (d) => d.properties["name"])
      // .on("mouseover", (d) => tooltip.show(d.properties.name, monthData[parseInt(d.id)]))
      .on("mouseover", (d) => {
        let tooltipContent =
          "<strong>County:</strong> " +
          d.properties.name +
          "<br/><strong>Case Count:</strong> " +
          monthData[parseInt(d.id)];
        tooltip.show(tooltipContent);
      })
      .on("mouseout", tooltip.hide)
      .on("click", function (event, d) {
        let isSelected = d3.select(this).classed("active-county");
        d3.selectAll(".active-county").classed("active-county", false);
        d3.select(this).classed("active-county", !isSelected);
        panelText.text(d.properties.name);
        if (!isSelected) {
          let countyData = {
            name: d.properties.name,
          };
          updatePanelWithCountyData(countyData);
        } else {
          panelText.text("");
        }
      });
  } else if (countyColor == "Risk Score") {
    d3.select(".county-borders").style("visibility", "visible");
    let monthData = riskData["20" + year][month];

    //console.log(monthData);

    // remove all counties
    // console.log("Month data: ", monthData);  // Debugging statement here
    // adjust the color scale to the min and max of the case density data
    vals = Object.values(monthData).map((d) => d[centrality]);
    // console.log("vals", vals)
    colorScale.domain([0, d3.max(vals)]);

    // color all counties
    let activeCountyId = null; // store currently active county ID

    counties
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", (d) => {
        try {
          return colorScale(monthData[parseInt(d.id)][centrality]);
        } catch {
          return 0;
        }
      })
      .attr("id", (d) => parseInt(d.id))
      .attr("name", (d) => d.properties["name"])
      // .on("mouseover", (d) => tooltip.show(d.properties.name, monthData[parseInt(d.id)]))
      .on("mouseover", (d) => {
        let tooltipContent =
          "<strong>County:</strong> " +
          d.properties.name +
          "<br/><strong>Case Count:</strong> " +
          caseData[month + "/" + year + " cases"][parseInt(d.id)];
        tooltip.show(tooltipContent);
      })
      .on("mouseout", tooltip.hide)
      .on("click", function (event, d) {
        let isSelected = d3.select(this).classed("active-county");
        d3.selectAll(".active-county").classed("active-county", false);
        d3.select(this).classed("active-county", !isSelected);
        panelText.text(d.properties.name);
        if (!isSelected) {
          let countyData = {
            name: d.properties.name,
          };
          updatePanelWithCountyData(countyData);
        } else {
          panelText.text("");
        }
      });
    return;
    // TODO
  } else if (countyColor == "None") {
    d3.select(".county-borders").style("visibility", "hidden");
  }
}

// Description: Given a lookup table for airport coordinates, edge data for the
// infection graph, and centrality scores, draws each airport on the map and
// shows outgoing edges when a node is hovered over.
// Nodes which have no info are colored grey.
//
// params:
// airportObj: lookup table, keys: 3-letter airport codes, vals: coordinates
// sickMonth: edge data for a given month
// centralityMonth: centrality data for a given month
function drawAirports(
  airportObj,
  sickMonthFrom,
  sickMonthTo,
  centralityMonth,
  centrality
) {
  // console.log(centralityMonth);
  // remove all airports
  airports.selectAll("*").remove();

  // adjust the radius scale to the min and max of the harmonic centrality data
  radiusScale.domain(
    d3.extent(
      Object.keys(centralityMonth).map((d) => centralityMonth[d][centrality])
    )
  );

  // console.log("asdf");

  // draw all airports
  airports
    .selectAll("circle") // denny changed airport to circle to match append
    .data(Object.keys(airportObj))
    .enter()
    .append("circle")
    .attr("cx", (d) => projection(airportObj[d]["coords"])[0])
    .attr("cy", (d) => projection(airportObj[d]["coords"])[1])
    .attr("r", (d) =>
      getAirportRadius(
        sickMonthFrom[d],
        sickMonthTo[d],
        centralityMonth[d],
        radiusScale,
        centrality
      )
    )
    .style("fill", (d) => {
      return sickMonthFrom[d] || sickMonthTo[d] ? "red" : "grey";
    })
    .on("mouseover", (d) => {
      mouseOverAirport(d, airportObj, sickMonthFrom[d], sickMonthTo[d]);
      airportTooltip.show(d, airportObj, centralityMonth[d]);
    })
    .on("mouseout", (d) => {
      flightPaths.selectAll("*").remove();
      tooltip.hide();
      airportTooltip.hide();
    })
    .on("click", (d) => panelText.text(airportObj[d]["name"]));
}

// Description: Given a node of our graph, its outgoing edges, its centrality scores,
// and a radius scale, outputs the size of the node.
//
// params:
// sickMonth: edge data for a given month
// centralityMonth: centrality data for a given month for a given airport
// radiusScale: object which determines how big to draw the radius of the airport node
function getAirportRadius(
  sickMonthFrom,
  sickMonthTo,
  centralityMonth,
  radiusScale,
  centrality
) {
  if (!(sickMonthFrom || sickMonthTo)) {
    return 0.5;
  }
  let rad = 0;
  if (centralityMonth) {
    rad = centralityMonth[centrality];
  }
  final_rad = radiusScale(rad);
  // console.log(final_rad);
  // console.log("final rad", final_rad);
  if (final_rad < 0) {
    return 0;
  } else {
    return final_rad;
  }
}

// Description: What we're supposed to do when we mouseover an airport.
// Removes all existing flight paths and adds ones from airport d to other
// airports, weighted by the infection density data.
//
// params:
// d: an airport, basically an entry of airportObj
// airportObj: lookup table, keys: 3-letter airport codes, vals: coordinates
// flightsFrom: a list of outgoing edges from the airport d
function mouseOverAirport(d, airportObj, flightsFrom, flightsTo) {
  // remove all currently displayed flight paths
  // flightPaths.selectAll("*").remove()

  // if we have no flight data from that node, do nothing
  if (flightsFrom) {
    // remove extraneous airports (apparently there are some airports in Canada or
    // something that are still in the data)
    let validFlights = Object.keys(flightsFrom).filter((d) => airportObj[d]);

    // adjust the scale to the min and max of the weight of our edges
    flightWeightScale.domain([
      0,
      d3.max(validFlights.map((d) => flightsFrom[d]["weight"])),
    ]);

    // draw all flights out of that airport
    flightPaths
      .selectAll("line")
      .data(validFlights)
      .enter()
      .append("line")
      .style("stroke", "yellow")
      .style("opacity", "1")
      .style("pointer-events", "none")
      .style("stroke-width", (data) =>
        flightWeightScale(flightsFrom[data]["weight"])
      )
      .attr("x1", projection(airportObj[d]["coords"])[0])
      .attr("y1", projection(airportObj[d]["coords"])[1])
      .attr("x2", (data) => projection(airportObj[data]["coords"])[0])
      .attr("y2", (data) => projection(airportObj[data]["coords"])[1])

      .each(function (d) {
        const totalLength = this.getTotalLength();
        d3.select(this)
          .style("stroke-dasharray", totalLength + " " + totalLength)
          .style("stroke-dashoffset", totalLength);
      })
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .style("stroke-dashoffset", 0);
  }

  if (flightsTo) {
    // remove extraneous airports (apparently there are some airports in Canada or
    // something that are still in the data)
    let validFlights = Object.keys(flightsTo).filter((d) => airportObj[d]);

    // adjust the scale to the min and max of the weight of our edges
    flightWeightScale.domain([
      0,
      d3.max(validFlights.map((d) => flightsTo[d]["weight"])),
    ]);

    // draw all flights into that airport
    flightPaths
      .selectAll("line")
      .data(validFlights)
      .enter()
      .append("line")
      .style("stroke", "orange")
      .style("pointer-events", "none")
      .style("stroke-width", (data) =>
        flightWeightScale(flightsTo[data]["weight"])
      )
      .attr("x2", projection(airportObj[d]["coords"])[0])
      .attr("y2", projection(airportObj[d]["coords"])[1])
      .attr("x1", (data) => projection(airportObj[data]["coords"])[0])
      .attr("y1", (data) => projection(airportObj[data]["coords"])[1])

      .each(function (d) {
        const totalLength = this.getTotalLength();
        d3.select(this)
          .style("stroke-dasharray", totalLength + " " + totalLength)
          .style("stroke-dashoffset", totalLength);
      })
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .style("stroke-dashoffset", 0);
  }
}

function updateLegend(caseData, centralityByMonth, centrality, countyColor) {
  legend.selectAll("*").remove(); // Clear the existing legend
  // legend.attr("transform", "translate(1000,50)");

  let maxCases = 0;

  if (countyColor == "Risk Score") {
    console.log("risk", caseData);
    maxCases = d3.max(Object.values(caseData).map((d) => d[centrality]));
  } else {
    console.log("case");
    maxCases = d3.max(Object.values(caseData)); // Get the maximum number of cases
  }

  // Find the max centrality value for the given 'centrality' key across all months
  const maxCentralityValue = d3.max(
    Object.values(centralityByMonth).map((obj) => obj[centrality])
  );

  // console.log(
  //   "Max centrality value for " + centrality + ": ",
  //   maxCentralityValue
  // );

  // Define the vertical gradient
  const gradient = legend
    .append("defs")
    .append("linearGradient")
    .attr("id", "gradient-vertical")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", "0%")
    .attr("y2", "100%");

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colorScale(maxCases)); // maximum color at the top

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colorScale(0)); // minimum color at the bottom

  // Draw the rectangle that will show the gradient
  legend
    .append("rect")
    .attr("x", 20)
    .attr("y", 20)
    .attr("width", 20)
    .attr("height", 200) // Taller rectangle for vertical gradient
    .style("fill", "url(#gradient-vertical)");

  // Add min label at the bottom
  legend
    .append("text")
    .attr("x", 45) // Position text to the right of the rectangle
    .attr("y", 220) // Position at the bottom of the rectangle
    .text("0"); // Minimum case count

  // Add max label at the top
  legend
    .append("text")
    .attr("x", 45) // Position text to the right of the rectangle
    .attr("y", 30) // Position at the top of the rectangle
    .text(maxCases); // Maximum case count

  // Add max label at the top
  legend
    .append("text")
    .attr("x", 60) // Position text to the right of the rectangle
    .attr("y", 125) // Position at the top of the rectangle
    .text(
      countyColor == "Risk Score"
        ? "Risk Score:\n" + centrality
        : "Cases per 100000"
    ); // Maximum case count

  // Add a circle below the rectangle
  legend
    .append("circle")
    .attr("cx", 30) // Centered horizontally with the rectangle
    .attr("cy", 250) // Positioned below the rectangle
    .attr("r", radiusScale(maxCentralityValue)) // Radius as calculated
    .attr("fill", "red"); // Fill color red

  // Optionally, add label for the circle
  legend
    .append("text")
    .attr("x", 45)
    .attr("y", 255) // Slightly below the circle center
    .text(`Max ${centrality}: `);

  // Optionally, add label for the circle
  legend
    .append("text")
    .attr("x", 45)
    .attr("y", 275) // Slightly below the circle center
    .text(`${maxCentralityValue}`);
}

// You would also need to calculate maxCentrality somewhere in your code,
// which represents the maximum centrality score to set up your radiusScale.

// Description: gets everything ready once the data has been loaded.
//
// params: all of the data or something. I'm too lazy to write all of this out tbh
// just look below here, in the block above the Promise.all() call, to find out what
// everything is.
function ready(
  caseData,
  monthList,
  usMap,
  airportLookup,
  sickEdgesByMonth,
  sickEdgesByMonthReversed,
  centralityByMonth,
  riskData
) {
  // console.log("rev", sickEdgesByMonthReversed);
  let year = "20";
  let month = "2";
  let centrality = "Harmonic Centrality";
  let countyColor = "Case Data";
  // Add functionality to the "Show Airports" checkbox
  d3.select("#airportToggle").on("change", function () {
    if (this.checked) {
      airports.style("visibility", "visible");
    } else {
      airports.style("visibility", "hidden");
    }
  });

  // adds month options to the dropdown menu, adds functionality to dropdown
  monthDropdown
    .selectAll("option")
    .data(monthList.columns)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);
  monthDropdown.on("change", () => {
    date = d3.event.target.value.split("/");
    month = date[0];
    year = date[1];

    colorCounties(
      usMap,
      caseData,
      riskData,
      month,
      year,
      countyColor,
      centrality
    );

    drawAirports(
      airportLookup,
      sickEdgesByMonth["20" + year][month],
      sickEdgesByMonthReversed["20" + year][month],
      centralityByMonth["20" + year][month],
      centrality
    );

    if (countyColor == "Risk Score") {
      updateLegend(
        riskData["20" + year][month],
        centralityByMonth["20" + year][month],
        centrality,
        countyColor
      );
    } else {
      updateLegend(
        caseData[d3.event.target.value + " cases per 100k"],
        centralityByMonth["20" + year][month],
        centrality,
        countyColor
      );
    }
  });

  // add centrality options to the dropdown menu
  let centralityOptions = Object.keys(centralityByMonth["2020"]["2"]["ABQ"]);
  centralityDrowdown
    .selectAll("option")
    .data(centralityOptions)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);

  centralityDrowdown.property("value", "Harmonic Centrality"); // this sets the devault value

  centralityDrowdown.on("change", function () {
    const selectedCentrality = d3.select(this).property("value");
    centrality = selectedCentrality;
    // console.log(selectedCentrality, year, month);
    drawAirports(
      airportLookup,
      sickEdgesByMonth["20" + year][month],
      sickEdgesByMonthReversed["20" + year][month],
      centralityByMonth["20" + year][month],
      centrality
    );
    if (countyColor == "Risk Score") {
      colorCounties(usMap, caseData, riskData, 2, 20, countyColor, centrality);
      updateLegend(
        riskData["20" + year][month],
        centralityByMonth["20" + year][month],
        centrality,
        countyColor
      );
    } else {
      updateLegend(
        caseData[`${month}/${year} cases per 100k`],
        centralityByMonth["20" + year][month],
        centrality,
        countyColor
      );
    }
  });

  // Adds functionality to the color dropdown menu
  colorDropdown.on("change", function () {
    countyColor = d3.event.target.value;
    colorCounties(
      usMap,
      caseData,
      riskData,
      month,
      year,
      countyColor,
      centrality
    );
    if (countyColor == "Risk Score") {
      updateLegend(
        riskData["20" + year][month],
        centralityByMonth["20" + year][month],
        centrality,
        countyColor
      );
    } else {
      updateLegend(
        caseData[`${month}/${year} cases per 100k`],
        centralityByMonth["20" + year][month],
        centrality,
        countyColor
      );
    }
  });

  // Draws the map and colors it according to Feb 2020 data
  drawOutlines(usMap);
  colorCounties(usMap, caseData, riskData, 2, 20, countyColor, centrality);
  drawAirports(
    airportLookup,
    sickEdgesByMonth["2020"]["2"],
    sickEdgesByMonthReversed["2020"]["2"],
    centralityByMonth["2020"]["2"],
    centrality
  );
  updateLegend(
    caseData["2/20 cases per 100k"],
    centralityByMonth["2020"]["2"],
    "Harmonic Centrality",
    countyColor
  );
}

// case density data by county
let caseData = d3.json("./data/data.json");

// list of months we are considering
let monthList = d3.csv("./data/months.csv");

// GeoJSON data for the US map
let usMap = d3.json("./data/counties.json");

// Lookup table of airport names and coordinates (key is 3-letter code)
let airportLookup = d3.json("./data/airport_lookup.json");

// Infection data outgoing edges of the flight graph
let sickEdgesByMonth = d3.json("./data/YearMonthEdgesSick.json");

// Infection data for incoming edges of the flight graph
let sickEdgesByMonthReversed = d3.json(
  "./data/YearMonthEdgesSickDestFirst.json"
);

// Centrality data for the flight graph
let centralityByMonth = d3.json("./data/YearMonthCentrality.json");

// Risk Scores for each year, month, county
let riskData = d3.json("./data/risk_scores.json");

// Loads the data and starts the visualization
Promise.all([
  caseData,
  monthList,
  usMap,
  airportLookup,
  sickEdgesByMonth,
  sickEdgesByMonthReversed,
  centralityByMonth,
  riskData,
]).then((d) => ready(...d));
