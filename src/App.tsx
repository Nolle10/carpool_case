import React, {Component, useEffect, useState} from 'react';
import './App.css';
import skeleton from './lego-skeleton.gif';
import data from './carpools.json';
import ReactDOM from "react-dom/client";


//INITIALIZATION OF ALL GLOBALLY USED VARIABLES
let date = new Date(Date.UTC(2021,11,0));
const myDrivers = new Map<string, Driver>();
let mapOfTrips = data.CarPoolEvents.filter(s=> convertStringToDate(s.Timestamp).getMonth() === date.getMonth());
let lastPassengerTime = new Map<string, Date>();
let noOfTrips = 0;
let noOfPassengerTrips = 0;


/**
 * THE STRUCTURE OF WHAT EACH DRIVER OBJECT HAS TO REPRESENT,
 * THIS IS TO SECURE CONSISTENT DATA
 */
interface Driver {
  DriverInitials: string;
  NoOfTrips: number;
  NoOfTripsAsPassenger: number;
  TimeOfLastDrive: Date;
  TimeOfLastTripAsPassenger?: Date;
}

//SORTS ALL THE DRIVER INITIALS
data.CarPoolEvents.sort(function (a,b){
  return compareStrings(a.Driver, b.Driver);
});




//GENERATES THE ELEMENTS IN THE MAP FOR EACH DRIVER
data.CarPoolEvents.forEach((ds) => lastPassengerTime.set(ds.Driver, new Date(Date.UTC(0,0,0))));


//ITERATES THROUGH EACH DRIVER, CHECKS IF THE DRIVER IS ALREADY IN A MAP AND UPDATES OR CREATES THE DRIVER
data.CarPoolEvents.forEach(d => {
  //Initialize the variables for each iteration
  let tempYear = +d.Timestamp.slice(0,4);
  let tempMonth = parseInt(d.Timestamp.slice(4,6));
  let tempDay = parseInt(d.Timestamp.slice(6,8));
  let timeOfDrive = new Date(Date.UTC(tempYear, tempMonth-1, tempDay));
  let timeOfLastDrive = new Date(Date.UTC(0,0,0));


  if(!myDrivers.has(d.Driver)){

    //GETS THE NUMBER OF TRIPS THE DRIVER HAS DRIVEN (2X SINCE IT IS ONE EACH WAY)
    let noOfTripsTemp = data.CarPoolEvents
        .filter((value) => value.Driver === d.Driver).length;
    noOfTrips = (noOfTripsTemp++ * 2);

    //GETS THE NUMBER OF TRIPS "PERSON" HAS GOTTEN AS A PASSENGER, CHECKS IF IT IS A ROUNDTRIP (2X IF IT IS)
    let noOfPassengerTripsTemp = 0;
    data.CarPoolEvents
        .filter((value) => value.Passengers.forEach((a) => {
          if(a.Name === d.Driver){
            if(isRoundtrip(a.Roundtrip)){
              return noOfPassengerTripsTemp += 2;
            }
            else{
              return noOfPassengerTripsTemp++;
            }
          }
        }))
    noOfPassengerTrips = noOfPassengerTripsTemp;

    let driver : Driver = {
      DriverInitials: d.Driver,
      NoOfTripsAsPassenger: noOfPassengerTrips,
      NoOfTrips: noOfTripsTemp,
      TimeOfLastDrive: new Date(Date.UTC(tempYear, tempMonth-1, tempDay)),
      TimeOfLastTripAsPassenger: new Date(Date.UTC(0,0,0))
    }

    myDrivers.set(d.Driver, driver);
  }
  else{
    //Checks if the latest registered time is before the current in the scope
    if(timeOfDrive > timeOfLastDrive){
      timeOfLastDrive = new Date(Date.UTC(tempYear, tempMonth-1, tempDay));
    }

    d.Passengers.forEach((passenger) => {
      /**
       * CHECKS IF THE MAP ENTRY IS UNDEFINED, IF NOT THEN CHECKS IF THE DATE IS BIGGER THAN THE OTHER
       * IF IT IS RETURNED TRUE IT WILL SET THE NEW MAP ENTRY TO THE CURRENT TIME OF DRIVING
      **/
      // @ts-ignore
      if(lastPassengerTime.get(passenger.Name) !== undefined && timeOfDrive > lastPassengerTime.get(passenger.Name)){
        lastPassengerTime.set(passenger.Name, timeOfDrive);
      }
    });

    let driver : Driver = {
      DriverInitials: d.Driver,
      NoOfTripsAsPassenger: noOfPassengerTrips,
      NoOfTrips: noOfTrips,
      TimeOfLastDrive: timeOfLastDrive,
      TimeOfLastTripAsPassenger: lastPassengerTime.get(d.Driver) ?? new Date()
    }

    myDrivers.set(d.Driver, driver);
  }

});

//UPDATES ALL DATES FOR WHEN THE DRIVER LAST HAD BEEN A PASSENGER
myDrivers.forEach(s => s.TimeOfLastTripAsPassenger = lastPassengerTime.get(s.DriverInitials));



function App() {
  const [allTripsMap, setAllTripsMap] = useState(mapOfTrips);

  console.log("THIS IS THE CURRENT DATE" + date);

  function goBackInTime(){
    if(date.getMonth() !== 0){
      console.log(date.getMonth()-1);
      date.setMonth(date.getMonth()-1);
      // @ts-ignore
      document.getElementById("date").innerHTML = date.toUTCString().slice(8, 16);
    }
    else{
      date.setFullYear(date.getFullYear()-1);
      date.setMonth(11);
      // @ts-ignore
      document.getElementById("date").innerHTML = date.toUTCString().slice(8, 16);
    }

    updateMap(date).sort(function (a,b){
      return compareDates(convertStringToDate(a.Timestamp), convertStringToDate(b.Timestamp))});

    setAllTripsMap(updateMap(date))
  }

  function goForthInTime(){
    if(date.getMonth() !== 12){
      date.setMonth(date.getMonth()+1);
      // @ts-ignore
      document.getElementById("date").innerHTML = date.toUTCString().slice(8, 16);
    }
    else{
      date.setFullYear(date.getFullYear()+1);
      date.setMonth(11);
      // @ts-ignore
      document.getElementById("date").innerHTML = date.toUTCString().slice(8, 16);
    }

    updateMap(date).sort(function (a,b){
      return compareDates(convertStringToDate(a.Timestamp), convertStringToDate(b.Timestamp))});

      setAllTripsMap(updateMap(date))
  }

  return (
        <div className="App">

          <h1> LEGO Interview 2023 </h1>

          <table className="table table-bordered">
            <tbody>
            <tr>
              <th>Initials</th>
              <th>Number of Trips</th>
              <th>Number of Trips as a Passenger</th>
              <th>Last Time as a Driver</th>
              <th>Last Time as a Passenger</th>
            </tr>
            </tbody>


            {Array.from(myDrivers.entries()).map(([key, value]) => (
                <tr>
                  <td>{value.DriverInitials}</td>
                  <td className={"td-padding"}>{value.NoOfTrips}</td>
                  <td className={"td-padding"}>{value.NoOfTripsAsPassenger}</td>
                  <td className={"td-padding"}>{value.TimeOfLastDrive.toString()}</td>
                  <td className={"td-padding"}>{value.TimeOfLastTripAsPassenger?.toString()}</td>
                </tr>
            ))}
          </table>


          <div className={"center"}>
            <div className={"container"}>
              <div className={"side"}>
                <button className={"arrow left"} id={"goBackInTime"} onClick={goBackInTime}></button>
              </div>
              <div className={"side"}>
                <h2 id={"date"}>{date.toUTCString().slice(8, 16)}</h2>
              </div>
              <div className={"side"}>
                <button className={"arrow right"} id={"goBackInTime"} onClick={goForthInTime}></button>
              </div>
            </div>
          </div>


          <table className={"table table-bordered"}>
            <tbody>
            <tr>
              <th>Date</th>
              <th>Driver</th>
              <th>Passengers</th>
            </tr>
            </tbody>


            {Array.from(mapOfTrips.entries()).map(([key, value]) => (
                <tr>
                  <td className={"td-padding"}>{value.Timestamp.slice(6,8) + "-" + value.Timestamp.slice(4,6) + "-" + value.Timestamp.slice(0,4)}</td>
                  <td className={"td-padding"}>{value.Driver}</td>
                  <td className={"td-padding"}>
                    {Array.from(value.Passengers.entries()).map(([key, value]) => (
                        <ul>
                          <li id={"passengerInitials"}>{value.Name}</li>
                        </ul>
                    ))}
                  </td>
                </tr>
            ))
            }

          </table>
          <img src={skeleton} alt={"This is a lego skeleton"}/>
        </div>
  );
}
function compareStrings(a: string, b: string) {
  // Assuming you want case-insensitive comparison
  a = a.toLowerCase();
  b = b.toLowerCase();

  return (a < b) ? -1 : (a > b) ? 1 : 0;
}

function compareDates(a: Date, b: Date) {
  return (a < b) ? -1 : (a > b) ? 1 : 0;
}

function convertStringToDate(a: string): Date{
  let tempYear = +a.slice(0,4);
  let tempMonth = parseInt(a.slice(4,6));
  let tempDay = parseInt(a.slice(6,8));

  return new Date(Date.UTC(tempYear, tempMonth-1, tempDay));
}

function isRoundtrip(a:boolean){
  return a;
}

function updateMap(a: Date){
  return mapOfTrips = data.CarPoolEvents.filter(s=> convertStringToDate(s.Timestamp).getMonth() === a.getMonth() && convertStringToDate(s.Timestamp).getFullYear() === a.getFullYear()).sort(function (a,b){
    return compareDates(convertStringToDate(a.Timestamp), convertStringToDate(b.Timestamp))});

}
export default App;
