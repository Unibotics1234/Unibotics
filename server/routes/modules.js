const express = require('express');
const router  = express.Router({ mergeParams: true });
const { protect, adminOnly } = require('../middleware/auth');
const {
  getModulesForCourse,
  createModule,
  deleteModule
} = require('../controllers/moduleController');

router.get('/',     getModulesForCourse);
router.post('/',    protect, adminOnly, createModule);

module.exports = router;

// Separate router for /api/modules/:id (delete needs no course prefix)
const standaloneRouter = express.Router();
standaloneRouter.delete('/:id', protect, adminOnly, deleteModule);
module.exports.standalone = standaloneRouter;