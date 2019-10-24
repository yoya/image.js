var Statistics = require("../lib/statistics")

var arr = [1, 2, 3, 4];
var arr2 = [7, 8, 9, 10];
var ave = Statistics.average(arr);
var ave2 = Statistics.average(arr2);
var vari = Statistics.variance(arr, ave);
var [vari1, vari2, cov] = Statistics.variance_covariance(arr, arr2, ave, ave2);
var max =  Statistics.max(arr);
var min =  Statistics.min(arr);
var [max2, min2] =  Statistics.max_min(arr);
var arrNorm =  Statistics.normalize(arr, 100);
var arrNorm2 =  Statistics.normalize(arr2, 100);

console.log("arr:", arr);
console.log("ave:", ave);
console.log("vari:", vari);
console.log("vari1, vari2, cov:", vari1, vari2, cov);
console.log("max, min:", max, min, max2, min2);
console.log("arrNorm", arr, arrNorm, arrNorm2);
