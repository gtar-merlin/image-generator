const Ajv = require("ajv");
const schema = require("../../schemas/diagram-spec.schema.json");

const ajv = new Ajv({ allErrors: true, jsonPointers: true });
const validate = ajv.compile(schema);

function validateDiagramSpec(spec) {
  const isValid = validate(spec);
  return {
    isValid: !!isValid,
    errors: validate.errors || []
  };
}

module.exports = {
  validateDiagramSpec
};
