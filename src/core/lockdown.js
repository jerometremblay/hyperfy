lockdown({
  // TODO: in production we may want to flip these
  // but for now this lets us see errors during dev
  errorTaming: 'unsafe',
  errorTrapping: 'report',
  unhandledRejectionTrapping: 'report',

  //
  // regExpTaming: 'unsafe',
  // localeTaming: 'unsafe',
  // consoleTaming: 'unsafe',
  // evalTaming: 'unsafeEval',
  // // stackFiltering: ''
  // domainTaming: 'unsafe',

  // harden() is real, so the shared intrinsics are frozen for app scripts.
  // 'severe' lets libraries assign over inherited intrinsic properties on their own objects,
  // which two of ours do at runtime: monaco 0.49 (Monarch's arrayToHash sets result['constructor'])
  // and d3-color (define.js sets prototype.constructor). 'moderate' breaks both.
  overrideTaming: 'severe',
})
