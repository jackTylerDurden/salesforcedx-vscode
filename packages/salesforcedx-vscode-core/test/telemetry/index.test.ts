import { expect } from 'chai';
import { assert, SinonStub, stub } from 'sinon';
import { window } from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { SfdxCoreSettings } from '../../src/settings/sfdxCoreSettings';
import { TelemetryService } from '../../src/telemetry/telemetry';
import { MockContext } from './MockContext';

describe('Telemetry', () => {
  let mShowInformation: SinonStub;
  let settings: SinonStub;
  let mockContext: MockContext;
  let reporter: SinonStub;

  beforeEach(() => {
    mShowInformation = stub(window, 'showInformationMessage').returns(
      Promise.resolve(null)
    );
    settings = stub(SfdxCoreSettings.prototype, 'getTelemetryEnabled').returns(
      true
    );
    reporter = stub(TelemetryReporter.prototype, 'sendTelemetryEvent');
  });

  afterEach(() => {
    mShowInformation.restore();
    settings.restore();
    reporter.restore();
  });

  it('Should show telemetry info message', async () => {
    // create vscode extensionContext in which telemetry msg has never been previously shown
    mockContext = new MockContext(false);

    const telemetryService = TelemetryService.getInstance();
    telemetryService.initializeService(mockContext);

    const telemetryEnabled = telemetryService.isTelemetryEnabled();
    expect(telemetryEnabled).to.be.eql(true);

    telemetryService.showTelemetryMessage();
    assert.calledOnce(mShowInformation);
  });

  it('Should not show telemetry info message', async () => {
    // create vscode extensionContext in which telemetry msg has been previously shown
    mockContext = new MockContext(true);

    const telemetryService = TelemetryService.getInstance();
    telemetryService.initializeService(mockContext);

    const telemetryEnabled = telemetryService.isTelemetryEnabled();
    expect(telemetryEnabled).to.be.eql(true);

    telemetryService.showTelemetryMessage();
    assert.notCalled(mShowInformation);
  });

  it('Should send telemetry data', async () => {
    // create vscode extensionContext in which telemetry msg has been previously shown
    mockContext = new MockContext(true);

    const telemetryService = TelemetryService.getInstance();
    telemetryService.initializeService(mockContext);

    telemetryService.sendExtensionActivationEvent();
    assert.calledOnce(reporter);
  });

  it('Should not send telemetry data', async () => {
    // create vscode extensionContext
    mockContext = new MockContext(true);
    // user has updated settings for not sending telemetry data.
    settings.restore();
    settings = stub(SfdxCoreSettings.prototype, 'getTelemetryEnabled').returns(
      false
    );

    const telemetryService = TelemetryService.getInstance();
    telemetryService.initializeService(mockContext);

    const telemetryEnabled = telemetryService.isTelemetryEnabled();
    expect(telemetryEnabled).to.be.eql(false);

    telemetryService.sendCommandEvent('create_apex_class_command');
    assert.notCalled(reporter);
  });

  it('Check telemetry sendExtensionActivationEvent data format', async () => {
    // create vscode extensionContext
    mockContext = new MockContext(true);

    const telemetryService = TelemetryService.getInstance();
    telemetryService.initializeService(mockContext);

    telemetryService.sendExtensionActivationEvent();
    assert.calledOnce(reporter);
    assert.calledWith(reporter, 'activationEvent');
  });

  it('Check telemetry sendExtensionDeactivationEvent data format', async () => {
    // create vscode extensionContext
    mockContext = new MockContext(true);

    const telemetryService = TelemetryService.getInstance();
    telemetryService.initializeService(mockContext);

    telemetryService.sendExtensionDeactivationEvent();
    assert.calledOnce(reporter);
    assert.calledWith(reporter, 'deactivationEvent');
  });

  it('Check telemetry sendCommandEvent data format', async () => {
    // create vscode extensionContext
    mockContext = new MockContext(true);

    const telemetryService = TelemetryService.getInstance();
    telemetryService.initializeService(mockContext);

    telemetryService.sendCommandEvent('create_apex_class_command');
    assert.calledOnce(reporter);

    const expectedData = { commandName: 'create_apex_class_command' };
    assert.calledWith(reporter, 'commandExecution', expectedData);
  });
});
