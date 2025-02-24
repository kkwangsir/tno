import { Modal } from 'components/modal';
import { formatDate } from 'features/utils';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useReportInstances, useReports } from 'store/hooks';
import {
  Checkbox,
  Col,
  getReportKind,
  IReportInstanceModel,
  ReportKindName,
  ReportStatusName,
  Show,
  useModal,
} from 'tno-core';

import { IReportForm, IReportInstanceContentForm } from '../interfaces';
import { toForm } from '../utils';
import {
  ReportContentMenuOption,
  ReportHistoryMenuOption,
  ReportMainMenuOption,
  ReportSettingsMenuOption,
  ReportViewMenuOption,
} from './constants';
import { ReportEditContentForm, ReportEditSortForm, ReportEditSummaryForm } from './content';
import { ReportEditActions } from './ReportEditActions';
import { useReportEditContext } from './ReportEditContext';
import { ReportEditMenu } from './ReportEditMenu';
import {
  ReportEditDataSourcesForm,
  ReportEditDetailsForm,
  ReportEditPreferencesForm,
  ReportEditSendForm,
  ReportEditSubscribersForm,
  ReportEditTemplateForm,
} from './settings';
import * as styled from './styled';
import { ReportHistoryForm, ReportViewForm } from './view';

export interface IReportEditFormProps {
  /** Whether edit functionality is disabled. */
  disabled?: boolean;
  /** Event fires when the content headline is clicked. */
  onContentClick?: (content?: IReportInstanceContentForm, action?: 'previous' | 'next') => void;
  /** Event to update the original report. */
  updateForm: (values: IReportForm) => void;
}

/**
 * Provides a component which displays the correct form based on the active menu.
 * @param param0 Component properties.
 * @returns Component.
 */
export const ReportEditForm = React.forwardRef<HTMLDivElement | null, IReportEditFormProps>(
  ({ disabled, updateForm, onContentClick }, ref) => {
    const navigate = useNavigate();
    const {
      values,
      active,
      activeRow,
      setActiveRow,
      setFieldValue,
      onNavigate,
      onGenerate,
      isSubmitting,
      setSubmitting,
    } = useReportEditContext();
    const [, { updateReport }] = useReports();
    const [{ updateReportInstance, publishReportInstance }] = useReportInstances();
    const { toggle: toggleUnlockReport, isShowing: isShowingUnlockReport } = useModal();
    const { toggle: toggleStartNewReport, isShowing: isShowingStartNewReport } = useModal();
    const { toggle: toggleSend, isShowing: isShowingSend } = useModal();

    const [showStartNextReport, setShowStartNextReport] = React.useState(true);

    const instance = values.instances.length ? values.instances[0] : undefined;
    const reportKind = getReportKind(values);

    React.useEffect(() => {
      if (
        showStartNextReport &&
        !isShowingStartNewReport &&
        !active?.startsWith(ReportMainMenuOption.Settings) &&
        instance &&
        instance.sentOn &&
        ![ReportStatusName.Reopen].includes(instance.status) &&
        reportKind === ReportKindName.Manual
      ) {
        setShowStartNextReport(false);
        toggleStartNewReport();
      }
    }, [
      active,
      disabled,
      instance,
      isShowingStartNewReport,
      showStartNextReport,
      toggleStartNewReport,
      reportKind,
    ]);

    const handlePublish = React.useCallback(
      async (instance: IReportInstanceModel) => {
        try {
          setSubmitting(true);
          const updatedInstance = await publishReportInstance(instance.id, !!instance.sentOn);
          setFieldValue(
            'instances',
            values.instances.map((i) =>
              i.id === instance.id ? { ...updatedInstance, content: instance?.content } : i,
            ),
          );
          toast.success(
            'Report has been submitted.  You will be notified when it is emailed to subscribers.',
          );
        } catch {
        } finally {
          setSubmitting(false);
        }
      },
      [publishReportInstance, setFieldValue, setSubmitting, values.instances],
    );

    const handleStartNewReport = React.useCallback(
      async (values: IReportForm) => {
        try {
          setSubmitting(true);
          const result = await updateReport(values);
          const form = await onGenerate(toForm({ ...result, instances: values.instances }), true);
          if (form) updateForm(form);
        } catch {
        } finally {
          setSubmitting(false);
        }
      },
      [onGenerate, setSubmitting, updateForm, updateReport],
    );

    return (
      <styled.ReportEditForm className="report-edit-form" ref={ref}>
        <ReportEditMenu
          onChange={(path) => {
            setActiveRow?.(undefined);
            navigate(path);
          }}
        />
        {/* Settings Menu */}
        <Show visible={active === ReportSettingsMenuOption.Info}>
          <ReportEditDetailsForm />
        </Show>
        <Show visible={active === ReportSettingsMenuOption.Sections}>
          <ReportEditTemplateForm />
        </Show>
        <Show visible={active === ReportSettingsMenuOption.DataSources}>
          <ReportEditDataSourcesForm updateForm={updateForm} />
        </Show>
        <Show visible={active === ReportSettingsMenuOption.Preferences}>
          <ReportEditPreferencesForm />
        </Show>
        <Show visible={active === ReportSettingsMenuOption.Subscribers}>
          <ReportEditSubscribersForm />
        </Show>
        <Show visible={active === ReportSettingsMenuOption.Send}>
          <ReportEditSendForm
            onPublish={() => toggleSend()}
            onGenerate={() => toggleStartNewReport()}
          />
        </Show>
        {/* Content Menu */}
        <Show visible={active === ReportContentMenuOption.Content}>
          <ReportEditContentForm
            disabled={disabled}
            activeRow={activeRow}
            showAdd={!activeRow}
            updateForm={updateForm}
            onContentClick={(content, action) => {
              if (action) {
                onNavigate(instance, action);
              } else {
                setActiveRow(content);
                onContentClick?.(content);
              }
            }}
          />
        </Show>
        <Show visible={active === ReportContentMenuOption.Sort}>
          <ReportEditSortForm
            disabled={disabled}
            activeRow={activeRow}
            onContentClick={(content, action) => {
              if (action) {
                onNavigate(instance, action);
              } else {
                setActiveRow(content);
                onContentClick?.(content);
              }
            }}
          />
        </Show>
        <Show visible={active === ReportContentMenuOption.Summary}>
          <ReportEditSummaryForm disabled={disabled} />
        </Show>
        {/* Preview Menu */}
        <Show visible={active === ReportViewMenuOption.View}>
          <ReportViewForm />
        </Show>
        {/* Send Menu */}
        <Show visible={active === ReportHistoryMenuOption.History}>
          <ReportHistoryForm />
        </Show>
        <ReportEditActions
          disabled={disabled}
          onPublish={() => toggleSend()}
          onUnlock={() => toggleUnlockReport()}
          onGenerate={() => toggleStartNewReport()}
        />
        <Modal
          headerText="Send Report to Subscribers"
          body={`Do you want to send an email to the subscribers of this report? ${
            instance?.sentOn ? 'This report has already been sent out by email.' : ''
          }`}
          isShowing={isShowingSend}
          onClose={toggleSend}
          type="default"
          confirmText="Yes, send report to subscribers"
          onConfirm={async () => {
            try {
              if (instance) await handlePublish(instance);
            } finally {
              toggleSend();
            }
          }}
        />
        <Modal
          headerText="Unlock Report"
          body={
            <Col>
              <p>
                {`The current report was sent to subscribers on `}
                <strong>{`${formatDate(instance?.sentOn?.toLocaleString(), true)}`}</strong>.
              </p>
              <p>
                It is almost always preferable to start the next report rather than unlocking the
                current report.
              </p>
              <p>If you unlock the report you will lose the history of the report being sent.</p>
            </Col>
          }
          isShowing={isShowingUnlockReport}
          onClose={toggleUnlockReport}
          type="default"
          confirmText="Yes, unlock this report"
          onConfirm={async () => {
            try {
              if (instance) {
                const result = await updateReportInstance({
                  ...instance,
                  body: '',
                  status: ReportStatusName.Reopen,
                });
                const updatedInstance = { ...result, content: instance.content };
                updateForm({
                  ...values,
                  instances: values.instances.map((i) =>
                    i.id === result.id ? updatedInstance : i,
                  ),
                });
              }
            } finally {
              toggleUnlockReport();
            }
          }}
        />
        <Modal
          headerText="Start Next Report"
          isSubmitting={isSubmitting}
          body={
            <Col>
              <p>
                {`The current report was sent to subscribers on `}
                <strong>{`${formatDate(instance?.sentOn?.toLocaleString(), true)}`}</strong>.
              </p>
              <Checkbox
                name={`settings.content.copyPriorInstance`}
                label="Empty report when starting next report"
                checked={!values.settings.content.copyPriorInstance}
                onChange={(e) => {
                  setFieldValue('settings.content.copyPriorInstance', !e.target.checked);
                }}
              />
              <p>Would you like to start the next report?</p>
            </Col>
          }
          isShowing={isShowingStartNewReport}
          onClose={toggleStartNewReport}
          type="default"
          confirmText="Yes, start the next report"
          onConfirm={async () => {
            try {
              await handleStartNewReport(values);
            } finally {
              toggleStartNewReport();
            }
          }}
        />
      </styled.ReportEditForm>
    );
  },
);
