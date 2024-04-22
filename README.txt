----------------------------------------------------------------------------------------------------------------------------


We created an interactive tool that visualizes the spread of COVID in the US during the pandemic, along with the flight 
data during that same time period. We have additionally run centrality algorithms on the graph of airports to determine 
which airports (and by extension, which areas of the US) are most at risk for travel-related transmission. We hope that 
this will allow users to better understand the impacts of airplane travel and help impact future decisions when it comes 
to travel in pandemic conditions.


----------------------------------------------------------------------------------------------------------------------------
------------------------------------------------ INSTALLATION AND EXECUTION ------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------


- input_data contains all the data that is needed to be input
	- PopulationEstimates.xlsx: 
		- https://www.ers.usda.gov/data-products/county-level-data-sets/county-level-data-sets-download-data/
 	- T_T100_SEGMENT_ALL_CARRIER 20XX.csv:
		- https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FMG&QO_fu146_anzr
  		- Selected elements: ["DEPARTURES_SCHEDULED0", "DEPARTURES_PERFORMED", "PASSENGERS", "UNIQUE_CARRIER", 
			"UNIQUE_CARRIER_NAME", "ORIGIN_AIRPORT_ID", "ORIGIN", "DEST_AIRPORT_ID", "DEST", "AIRCRAFT_TYPE",
			"YEAR", "MONTH"]
	- counties.json:
		- https://github.com/topojson/us-atlas?tab=readme-ov-file
 	- covid_cases_by_county.csv: 
		- https://github.com/CSSEGISandData/COVID-19
  	- us-airports.csv: 
		- https://koordinates.com/layer/748-us-airports/
  	
- For Data Processing:
	- Place the above files into input_data folder
	- Run DataProcessing.py to process all the data for the visualization
  		- This will create two folders
   			- temp_data: this is all the temporary files that are created as part of the processing. 
				- This is left here if anyone in the future decides to add on or change our visualization
				- Feel free to delete it once all processing is done.
     			- data: This is the final data used in the visualization
- Visualization:
	- Once data is finished processing, start an HTML server and load up visualization.html to see the final product
 
----------------------------------------------------------------------------------------------------------------------------
