// @flow

describe('file upload', () => {
  it('click', () => {
    cy.task('getDemoStartLink').then((startLink) => {
      cy.visit(startLink);

      // Welcome page
      cy.contains('Get started', {timeout: 6000}).click();

      // Document select page
      cy.contains('Next').click();

      // Image upload page
      cy.contains('I consent').click();

      // Upload front image
      cy.contains('Other options').click();
      cy.contains('Upload images').click();

      let fileName = 'drivers_license_front.jpg';
      cy.fixture(fileName).then((fileContent) => {
        cy.get('input[type="file"]').upload({
          fileContent,
          fileName,
          mimeType: 'image/jpeg',
        });
      });

      cy.contains('Continue', {timeout: 10000}).click();

      // Upload back image
      fileName = 'drivers_license_back.jpg';
      cy.fixture(fileName).then((fileContent) => {
        cy.get('input[type="file"]').upload({
          fileContent,
          fileName,
          mimeType: 'image/jpeg',
        });
      });

      cy.contains('Continue', {timeout: 10000}).click();

      // Success page
      cy.contains('Go back to').should('be.visible');
    });
  });
});
