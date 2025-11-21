const modelRepository = require("../repositories/modelRepository");

class ModelService {
  async getAll() {
    return await modelRepository.getAll();
  }
}
module.exports = new ModelService();
