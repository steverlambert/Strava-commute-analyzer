
	var body = document.getElementsByTagName("body")[0];
	var splitTime = [5000,5000];
	var split_date = ['',''];
	getActivities();
	
	
function getActivities() {
	var unixTime = Math.floor(Date.now() / 1000);
	var beforeT = unixTime.toString();
	var afterT = '1546300800';
	var requestURL = 'https://www.strava.com/api/v3/athlete/activities?before=' + beforeT + '&after=' + afterT + '&page=1&per_page=40';
	callStrava(requestURL, handleResponseCommute);
}

function getSegments(commutes) {
	var dataToWork = commutes.toWork;
	var dataFromWork = commutes.fromWork;
	var allCommutes = commutes.allCommutes;

	for (var i = 0; i<allCommutes.length; i++){
		var activityID = allCommutes[i].id;
		var requestURL = 'https://www.strava.com/api/v3/activities/' + activityID + '?include_all_efforts=true';
		callStrava(requestURL, handleSegmentResponse);
	}
	revealBestSplit();
}

//var allData = allData2;
function formatData(bigArray) {

  var stravaData_towork = [];
  var stravaData_fromwork = [];
  var radius = .03;
  for (var i = 0; i < bigArray.length; i++) {
  	var xstart = Number(bigArray[i].start_latlng[0]);
    var ystart = Number(bigArray[i].start_latlng[1]);
    var xhouse = 47.7;
    var yhouse = -122.29;
    
    var xend = bigArray[i].end_latlng[0];
    var yend = bigArray[i].end_latlng[1];
	var xwork = 47.58
	var ywork = -122.17
    
	var circlestart = Math.sqrt(Math.pow((xstart-xhouse),2) + Math.pow((ystart-yhouse),2));
    var circleend = Math.sqrt(Math.pow((xend-xwork),2) + Math.pow((yend-ywork),2));
    var circlestart2 = Math.sqrt(Math.pow((xstart-xwork),2) + Math.pow((ystart-ywork),2));
    var circleend2 = Math.sqrt(Math.pow((xend-xhouse),2) + Math.pow((yend-yhouse),2));
	console.log(circlestart);
	
  	if(bigArray[i].type == 'Ride') {
    	if (circlestart < radius && circleend < radius) {
   	 stravaData_towork.push(bigArray[i])
    	} else if (circlestart2 < radius && circleend2 < radius)
      stravaData_fromwork.push(bigArray[i])
		}		
  }
	
	var commutes = new UserCommutes(stravaData_towork, stravaData_fromwork);

 // showStats(stravaData_towork);
	makeTable(stravaData_towork);
	var bests_towork = findBests(stravaData_towork);
	makeBestTable(bests_towork);
  	makeTable(stravaData_fromwork);
  	var bests_fromwork = findBests(stravaData_fromwork);
  	makeBestTable(bests_fromwork);
	return commutes;
}

function findBests(allArray) {
	var allBests = [30000,0,30000,0,30000,0];
	var bestArray = [];
	
	for(var i = 0; i < allArray.length; i++) {	
		var mtRaw = allArray[i].moving_time;
		var etRaw = allArray[i].elapsed_time;
		var wtRaw = etRaw - mtRaw; 

		if (wtRaw < allBests[0]) {
			allBests[0] = wtRaw;
			allBests[1] = i;
			bestArray[0] = allArray[i];
		}
		if (etRaw < allBests[2]) {
			allBests[2] = etRaw;
			allBests[3] = i;
			bestArray[1] = allArray[i];
		}
		if (mtRaw < allBests[4]) {
			allBests[4] = mtRaw;
			allBests[5] = i;
			bestArray[2] = allArray[i];
		}
	}
	return bestArray;
}

function showStats(jsonObj) {
    
		var allBests = [30000,0,30000,0,30000,0]; // wt time, wt index, mt time, mt index, et time, et index
		var headers = ["Least Wasted Time", "Fastest Moving Time", "Fastest Elapsed Time"];
		
		// loop for all activities, find best times
		
		for(var i = 0; i < jsonObj.length; i++) {	
			
			var myArticle = document.createElement('article');
			var myH2 = document.createElement('h2');
			var dist = document.createElement('p');
			var moveTime = document.createElement('p');
			var elapsedTime = document.createElement('p');
			var wastedTime = document.createElement('p');

			var mtRaw = jsonObj[i].moving_time;
			var etRaw = jsonObj[i].elapsed_time;

			var distRaw = jsonObj[i].distance;
			var distM = Math.round((distRaw/1609.344) * 10) / 10;

			var wtRaw = etRaw - mtRaw; 
			
			if (wtRaw < allBests[0]) {
				allBests[0] = wtRaw;
				allBests[1] = i;
			}
			if (etRaw < allBests[2]) {
				allBests[2] = etRaw;
				allBests[3] = i;
			}
			if (mtRaw < allBests[4]) {
				allBests[4] = mtRaw;
				allBests[5] = i;
			}
			
			var date = jsonObj[i].start_date; 
			date = date.slice(0,10);

			myH2.textContent = jsonObj[i].name + ' ' + date;
			dist.textContent = 'Distance: ' + distM + ' miles';
			moveTime.textContent = 'Moving Time: ' + convertTime(mtRaw);
			elapsedTime.textContent = 'Elapsed Time: ' + convertTime(etRaw);
			wastedTime.textContent = 'Wasted Time: ' + convertTime(wtRaw);
    
		
			myArticle.appendChild(myH2);
			myArticle.appendChild(dist);
			myArticle.appendChild(moveTime);
			myArticle.appendChild(elapsedTime);
			myArticle.appendChild(wastedTime);

			section.appendChild(myArticle);
		}
		
		// Loop for 3 best categories
		
		for (var j=0; j<allBests.length; j+=2) {
			var myArticle2 = document.createElement('article');
			var bestHeader = document.createElement('h2');
			var bestName = document.createElement('p');
			var bestTime = document.createElement('p');
			var bestDistance = document.createElement('p');
			var rawBestDistance = jsonObj[allBests[j+1]].distance;
			var roundBestDistance = Math.round((rawBestDistance/1609.344) * 10) / 10;
			bestHeader.textContent = headers[j/2]; 
			bestName.textContent = jsonObj[allBests[j+1]].name + ' on ' + jsonObj[allBests[j+1]].start_date.slice(0,10); 
			bestTime.textContent = convertTime(allBests[j]);
			bestDistance.textContent = roundBestDistance + ' miles';
			myArticle2.appendChild(bestHeader);
			myArticle2.appendChild(bestName);
			myArticle2.appendChild(bestTime);
			myArticle2.appendChild(bestDistance);
			header.appendChild(myArticle2);
		}	
}

function convertTime(totalSeconds) {
 		var hours = Math.floor(totalSeconds / 3600); 
    totalSeconds %= 3600;
    var minutes = Math.floor(totalSeconds / 60); 
    var seconds = totalSeconds % 60;
    return hours + "h " + minutes + "m " + seconds + "s ";
}

function timeFromDate(date) {
	var time = new Date(date);
	var hours = time.getHours();
	var minutes = time.getMinutes();
	var seconds = time.getSeconds();
	var totalSeconds = 3600 * hours + 60 * minutes + seconds;
	return totalSeconds;
}

function makeTable(jsonArray) {
	var ourTable     = document.createElement("table");
	var ourTableBody = document.createElement("tbody");

  //table headers
	var header = document.createElement("tr");
	var headerText = ['Name', 'Date', 'Time', 'Distance', 'Elevation'];
	for(var k=0; k<5; k++){
		var head = document.createElement("th");
		var headText = document.createTextNode(headerText[k]);
		head.appendChild(headText);
		header.appendChild(head);
	}
	ourTableBody.appendChild(header);
	//end headers

		for (var i = 0; i < jsonArray.length; i++) {

			var row = document.createElement("tr");
			
			var mtRaw = jsonArray[i].moving_time;
			var etRaw = jsonArray[i].elapsed_time;

			var distRaw = jsonArray[i].distance;
			var distM = Math.round((distRaw/1609.344) * 10) / 10;

			var wtRaw = etRaw - mtRaw;  
			var time = convertTime(mtRaw);
			var date = jsonArray[i].start_date; 
			date = date.slice(0,10);
			
			var gain = Math.round(jsonArray[i].total_elevation_gain * 3.28);

			for(var j=0; j<5; j++){
				var cell = document.createElement("td");
				var cellText = ''; 

				if (j == 0) cellText = document.createTextNode(jsonArray[i].name); 
				if (j == 1) cellText = document.createTextNode(date); 
				if (j == 2) cellText = document.createTextNode(time); 
				if (j == 3) cellText = document.createTextNode(distM); 
				if (j == 4) cellText = document.createTextNode(gain); 

				cell.appendChild(cellText);
				row.appendChild(cell);
				}

			ourTableBody.appendChild(row);
		}

		ourTable.appendChild(ourTableBody);
		body.appendChild(ourTable);
		ourTable.setAttribute("border", "2");
}

function makeBestTable(jsonArray) {
		var ourTable     = document.createElement("table");
		var ourTableBody = document.createElement("tbody");
	
		//table headers
		var header = document.createElement("tr");
		var headerText = ['Name', 'Date', 'Time', 'Distance', 'Elevation'];
		for(var k=0; k<5; k++){
			var head = document.createElement("th");
			var headText = document.createTextNode(headerText[k]);
			head.appendChild(headText);
			header.appendChild(head);
		}
		ourTableBody.appendChild(header);
		//end headers
	
			for (var i = 0; i < jsonArray.length; i++) {
	
				var row = document.createElement("tr");
				
				var mtRaw = jsonArray[i].moving_time;
				var etRaw = jsonArray[i].elapsed_time;
	
				var distRaw = jsonArray[i].distance;
				var distM = Math.round((distRaw/1609.344) * 10) / 10;
	
				var wtRaw = etRaw - mtRaw;  
				var time = convertTime(mtRaw);
				var timelabel = 'Moving Time: ';
				if(i==0) {
					time = convertTime(wtRaw);
					timelabel = 'Wasted Time: ';
				} else if (i==1) {
					time = convertTime(etRaw);
					timelabel = 'Elapsed Time: ';
				} else if (i==2) {
					time = convertTime(mtRaw)
					timelabel = 'Moving Time: ';
				}


				var date = jsonArray[i].start_date; 
				date = date.slice(0,10);
				
				var gain = Math.round(jsonArray[i].total_elevation_gain * 3.28);
	
				for(var j=0; j<5; j++){
					var cell = document.createElement("td");
					var cellText = ''; 
	
					if (j == 0) cellText = document.createTextNode(jsonArray[i].name); 
					if (j == 1) cellText = document.createTextNode(date); 
					if (j == 2) cellText = document.createTextNode(timelabel + time); 
					if (j == 3) cellText = document.createTextNode(distM); 
					if (j == 4) cellText = document.createTextNode(gain); 
	
					cell.appendChild(cellText);
					row.appendChild(cell);
					}
	
				ourTableBody.appendChild(row);
			}
	
			ourTable.appendChild(ourTableBody);
			body.appendChild(ourTable);
			ourTable.setAttribute("border", "2");
}

function callStrava(requestURL, handleResponse) {
	
	var request = new XMLHttpRequest();

	var bearer = 'Bearer abf002ab94fb00c0768d73ff67419e383fc7e1a1';

	request.open('GET', requestURL, false);
	request.setRequestHeader('Accept', 'application/json');
	request.setRequestHeader('Authorization', bearer);
	//request.responseType = 'application/json';
	request.onload = function() {
		handleResponse(request.response)
	}
	request.send();
}

function handleResponseCommute(response) {
	var allData1 = response;
	var allData2 = JSON.parse(allData1);
	var commutes = formatData(allData2);
	getSegments(commutes);
}

function handleSegmentResponse(response) {
	var allSegments1 = response;
	var allSegments2 = JSON.parse(allSegments1);
	analyzeSegmentData(allSegments2);
}

function analyzeSegmentData(activity) {
	var startTime = activity.start_date;
	var segments = activity.segment_efforts;

	for (var i = 0; i < segments.length; i++) {
		var segmentName = segments[i].name;
		if(segmentName == "520 Bridge Eastbound") {
			findSegmentTime(segments[i], 0, startTime);
		} else if (segmentName == '520 Bridge Westbound'){
			findSegmentTime(segments[i], 1, startTime);
		}
	}
}

function findSegmentTime(segment, number, startTime) {
	let endTime = segment.start_date;
	let importantTime = timeFromDate(endTime) - timeFromDate(startTime);
	if (importantTime < splitTime[number]) {
		splitTime[number] = importantTime; 
		split_date[number] = endTime; 
	}
}

function revealBestSplit() {
	var ourTable = document.createElement("table");
	var ourTableBody = document.createElement("tbody");
	var row = document.createElement("tr");
	var cell = document.createElement("td");
	var cellText = document.createTextNode('Best Split to Work: ' + convertTime(splitTime[0]) + ', ' + split_date[0].slice(0,10));
	var cell2 = document.createElement("tr");
	var cell2Text = document.createTextNode('Best Split from Work: ' + convertTime(splitTime[1]) + ', ' + split_date[1].slice(0,10));
	cell.appendChild(cellText);
	cell2.appendChild(cell2Text);
	row.appendChild(cell);
	row.appendChild(cell2);
	ourTableBody.appendChild(row);
	ourTable.appendChild(ourTableBody);
	body.appendChild(ourTable);
	ourTable.setAttribute("border", "2");
}

// CLASSES

function UserCommutes(toWork, fromWork) {
	this.toWork = toWork;
	this.fromWork = fromWork;
	
	this.allCommutes = toWork.concat(fromWork);
}