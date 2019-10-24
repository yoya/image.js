var Statistics = require("../lib/statistics")

var arr = [1, 2, 3, 4];
var arr2 = [7, 8, 9, 10];
var ave = Statistics.average(arr);
var vari = Statistics.variance(arr, ave);
var [vari1, vari2, cov] = Statistics.variance_covariance(arr, arr2, ave);
var [max, min] =  Statistics.max_min(arr);

console.log("arr:", arr);
console.log("ave:", ave);
console.log("vari:", vari);
console.log("vari1, vari2, cov:",  vari1,  vari2, cov);
console.log("max, min:", max, min);
