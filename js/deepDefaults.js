define(function() {

  const deepDefaults = function(original, ...defaultObjects) {
    defaultObjects.reverse().forEach(defaults => {
      Object.entries(defaults).forEach(([ key, defaultValue ]) => {
        if (typeof defaultValue === 'object' && !Array.isArray(defaultValue) && defaultValue !== null) {
          original[key] = deepDefaults(original[key] || {}, defaultValue);
          return;
        }
        if (original.hasOwnProperty(key)) return;
        original[key] = defaultValue;
      });
    });
    return original;
  };

  return deepDefaults;

});
