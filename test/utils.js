import MockAdaptModel from './MockAdaptModel';

export function makeIdGenerator () {
  let seed = 1;
  return () => (seed++).toString();
}

/**
 * Interpret a course from a simplified data structure. See generateHierarchy.
 * @param {array} data course data
 * @param {array} langs content will be duplicated for each language in the list (e.g. ['en', 'fr'])
 * @param {string} courseId the course identifier (e.g. 'm05')
 * @param {string} defaultLanguage which language will serve as the default (e.g. 'en')
 * @returns a tuple of (course content, config, ID generator)
 */
export function setupContent (data, langs = ['en'], courseId = 'm05', defaultLanguage = 'en') {
  const generateId = makeIdGenerator();
  const config = new MockAdaptModel({
    _id: generateId(),
    _type: 'config',
    _courseId: courseId,
    _defaultLanguage: defaultLanguage
  });

  const rawContent = generateModels(data, langs, courseId, generateId);
  const content = rawContent.map(obj => {
    const ModelClass = obj.__class || MockAdaptModel;
    delete obj.__class;
    return new ModelClass(obj);
  });

  assignChildren(content);
  assignParent(content);

  return [content, config, generateId];
}

/**
 * locate the first item in content that matches the given identifier and constraints
 * @param {string} identifier the _id or _friendlyId of the item under search (_id has precedence)
 * @param {Object} options additional constraints on the match (e.g. {_lang: 'en'})
 * @returns a single item or undefined
 */
export function lookup(content, identifier, options) {
  const matches = content.filter(i => i.get('_id') === identifier || i.get('_friendlyId') === identifier);
  return _.find(matches, options);
}

function assignChildren(models) {
  models.forEach(model => {
    const id = model.get('_id');
    const children = models.filter(model => model.get('_parentId') === id);
    model._childrenCollection = new Backbone.Collection(children);
  });
}

function assignParent(models) {
  models.forEach(model => {
    const parentId = model.get('_parentId');
    model._parentModel = models.find(model => model.get('_id') === parentId);
  });
}

function generateModels (data, langs, courseId, generateId) {
  const hierarchy = generateHierarchy(data, courseId, generateId);

  hierarchy.forEach(i => (i._lang = langs[0]));

  const hierarchiesForOtherLangs = langs.slice(1).map(lang => {
    // create a set of new identifiers for the new models
    const idMap = hierarchy.reduce((m, i) => { m[i._id] = generateId(); return m; }, {});
    // create the new models for [lang]
    return hierarchy.map(i => {
      return Object.assign({}, i, {
        _id: idMap[i._id],
        ...(i._parentId && { _parentId: idMap[i._parentId] }),
        _lang: lang
      });
    });
  });

  return hierarchy.concat(...hierarchiesForOtherLangs);
}

/**
 * generateHierarchy takes a flattened list of tuples that define content models and converts them into objects with hierarchical relationships. Hierarchy is inferred from list order unless parentage is specified. Each tuple is specified as [_type {string}, _friendlyId {string}, props {Object}]
 * @param {*} data a flat list of tuples describing the required models (see below for examples)
 * @param {*} courseId a unique identifier that relates the generated content
 * @param {*} generateId a function that returns a unique identifier
 * @returns
 */

/*
  co-05, co-10 are children of submenu1
  co-15, co-20 are children of submenu2
  submenu1, submenu2 are children of m05
[
  ['course', 'm05'],
  ['menu', 'submenu1'],
  ['page', 'co-05'],
  ['page', 'co-10'],
  ['menu', 'submenu2'],
  ['page', 'co-15'],
  ['page', 'co-20']
]
*/

/*
  co-05, co-10 are children of submenu1
  co-15, co-20 are children of submenu2
  submenu1 is a child of m05
  submenu2 is a child of submenu1
[
  ['course', 'm05'],
  ['menu', 'submenu1', { _id: 'submenu1' }],
  ['page', 'co-05'],
  ['page', 'co-10'],
  ['menu', 'submenu2', { _parentId: 'submenu1' }],
  ['page', 'co-15'],
  ['page', 'co-20']
]
*/

/*
  co-05 is a child of m05
  a-05 is a child of co-15
  b-05 is a child of a-05
  c-05 is a child of b-05
  a-15 is a child of co-05
[
  ['course', 'm05'],
  ['page', 'co-05'],
  ['article', 'a-05'],
  ['block', 'b-05'],
  ['component', 'c-05', { _layout: 'full' }],
  ['article', 'a-15']
]
*/

function generateHierarchy (data, courseId, generateId) {
  const models = data.map(([_type, _friendlyId, extra]) => ({ _type, _friendlyId, ...extra }));
  const course = models[0];

  course._courseId = courseId;
  // provide with _id if one not given
  course._id = course._id || generateId();

  let hasEncounteredMenu = false;

  const children = models.slice(1).filter(i => {
    i._courseId = courseId;

    // ensure all models have an _id
    if (!i._id) i._id = generateId();

    // children of course can only be menu or page
    if (!['menu', 'page'].includes(i._type)) return false;

    // check if item has specified course as parent
    if (i._parentId === course._id) return true;

    // check if parent other than course is specified
    if (i._parentId && i._parentId !== course._id) return false;

    // menu parent defaults to course
    if (i._type === 'menu') {
      hasEncounteredMenu = true;
      return true;
    }

    // pages following a menu default to being parented by last seen menu
    if (hasEncounteredMenu) return false;

    // page has no parent given, does not follow a menu, so is child of course
    return true;
  });

  // assign parent
  children.forEach((c, index) => {
    c._parentId = course._id;
    c._sortOrder = index + 1;
  });
  // children = children.filter(i => i._parentId === undefined || i._parentId === null)

  // course and menus have now been dealt with

  const types = ['menu', 'page', 'article', 'block', 'component'];
  types.slice(0, -1).forEach((rootType, typeIndex) => {
    let currentRoot;
    let sortOrder = 1;

    models.slice(1).forEach(c => {
      if (c._type === rootType) {
        currentRoot = c;
        sortOrder = 1;
        return;
      }

      // if rootType is menu then only examine pages, if rootType is page then only examine articles etc
      if (c._type !== types[typeIndex + 1]) return;

      // skip models already assigned a parent
      if (c._parentId) return;

      c._parentId = currentRoot._id;
      c._sortOrder = sortOrder++;
    });
  });

  return models;
}
