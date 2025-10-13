const { poolPromise } = require("../db");

exports.getAllServices = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT * FROM ServiceCatalog");
  return result.recordset;
};

exports.createService = async (data) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("Name", data.name)
    .input("Description", data.description)
    .input("Price", data.price)
    .query("INSERT INTO ServiceCatalog (Name, Description, Price) VALUES (@Name, @Description, @Price)");
};

exports.updateService = async (id, data) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("Id", id)
    .input("Name", data.name)
    .input("Description", data.description)
    .input("Price", data.price)
    .query(
      "UPDATE ServiceCatalog SET Name = @Name, Description = @Description, Price = @Price WHERE Id = @Id"
    );
};

exports.deleteService = async (id) => {
  const pool = await poolPromise;
  await pool.request().input("Id", id).query("DELETE FROM ServiceCatalog WHERE Id = @Id");
};
