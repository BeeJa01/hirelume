module.exports = {
  publicJobs: require('./publicJobs').router,
  applications: require('./applications').router,
  results: require('./results').router,
};
