# VA-Usage schema field dictionary

Current three-layer schema accompanying *From Design to Use: Understanding Documented Usage of Visual Analytics Systems*.

## 1. System Specification

### Top-level object: `SystemSpec`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `paperName` | string | No | Name of the paper. |
| `systemInfo` | SystemInfo | Yes | Information about the overall system, including taxonomy annotations. |
| `viewsInfo` | list of ViewSpec | Yes | Canonical per-view specifications for the system. |
| `coordinationInfo` | list of ViewCoordinationInfo | No | Coordination relationships between views or sub-views. |

### Nested object: `SystemInfo`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `systemName` | string | No | Name of the visual analytics system, as used in the paper. |
| `dataOntology` | DataOntology | No | Data ontology annotation for the system, based on the provided data taxonomy. If the taxonomy cannot describe a case, use others(<description>) in the corresponding field. |
| `systemCategory` | list of SystemCategory | No | Two-level system classification. Level-1 indicates the broad application domain; Level-2 indicates specific tasks/subdomains. Both levels allow others(<description>) when the taxonomy cannot describe a case. |

### Nested object: `DataOntology`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `datasetType` | list of enum / string | No | High-level dataset form(s) based on DatasetType taxonomy. Multiple values are allowed when a system uses multiple dataset forms. If not covered, use others(<description>). |
| `dataType` | list of enum / string | No | Data entity/structure types based on DataType taxonomy. Multiple values are allowed when a system uses multiple structures. If not covered, use others(<description>). |
| `attributeType` | list of enum / string | No | Attribute types involved in the system (categorical/ordinal/quantitative) based on AttributeType taxonomy. Multiple values are allowed. If not covered, use others(<description>). |
| `orderingDirection` | list of enum / string | No | Ordering/scale direction types (sequential/diverging/cyclic) based on OrderingDirection taxonomy, when applicable (e.g., color scales). Multiple values are allowed. If not covered, use others(<description>). |

### Nested object: `SystemCategory`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `level1` | enum / string | Yes | High-level domain category (Level-1). Must be one of the predefined Level-1 categories or others(<description>). |
| `level2` | list of enum / string | No | Sub-category / task-level classification (Level-2). Multiple values are allowed when the system spans multiple sub-tasks. Each value must be one of the predefined Level-2 categories or others(<description>). |

### Nested object: `ViewSpec`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `viewId` | string | No | Canonical identifier for this view. When omitted, a deterministic identifier can be generated. |
| `viewName` | string | No | Human-readable label for this view, if available. |
| `nameSource` | enum | No | How viewName was obtained. |
| `aliases` | list of string | No | Optional alternate labels or references used for this view (e.g., 'Fig. 1c'). |
| `description` | string | No | Brief description of the overall role of this top-level view. |
| `viewImages` | list of string | No | List of local file paths to image assets representing this view (e.g., screenshots, figure sub-images, UI captures). |
| `evidence` | EvidenceReference | No | Optional evidence supporting the existence and identity of this view. |
| `subViews` | list of SubView | Yes | List of sub-views contained in this view. |

### Nested object: `SubView`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `subViewId` | string | No | Canonical identifier for this sub-view. When omitted, a deterministic identifier can be generated. |
| `subViewName` | string | No | Human-readable name/identifier for this sub-view, if available. |
| `nameSource` | enum | No | How subViewName was obtained. |
| `aliases` | list of string | No | Optional alternate labels or references used for this sub-view (e.g., figure callouts). |
| `description` | string | No | Brief description of this sub-view, combining its approximate role/content and relative position (e.g., 'concept search panel on the left', 'detail table in the lower-right'). |
| `evidence` | EvidenceReference | No | Optional evidence supporting the sub-view as a coherent UI unit. |
| `isVisualizationView` | boolean | Yes | Whether this sub-view is a visualization view. If true, viewStyleInfo must be provided and nonVisualViewSpec must be omitted. If false, nonVisualViewSpec must be provided and viewStyleInfo must be omitted. |
| `viewStyleInfo` | ViewStyleInfo | No | Visualization-oriented style specification. Provide when isVisualizationView is true. |
| `nonVisualViewSpec` | NonVisualViewSpec | No | Non-visual view specification. Provide when isVisualizationView is false. |
| `capabilities` | list of SubviewCapability | No | User-visible capabilities of this sub-view. These capture what the user can directly do in the sub-view or what information the sub-view can directly provide. |

### Nested object: `SubviewCapability`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `capabilityId` | string | No | Canonical identifier for this capability. When omitted, a deterministic identifier can be generated. |
| `capabilityKind` | enum | Yes | Whether this capability is an interaction affordance or an information affordance. |
| `capabilityName` | string | Yes | Short label for the capability, e.g., `Search`, `Brush`, `Hover`, `Show Ranked Features`, or `Show Token Activations`. |
| `description` | string | Yes | What the user can do in this sub-view or what information the user can directly obtain from it. |
| `evidence` | EvidenceReference | No | Optional evidence supporting this capability extraction. |

### Nested object: `ViewStyleInfo`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `layers` | list of LayerInfo | Yes | Information about styles of multiple layers / marks in this view. |
| `evidence` | EvidenceReference | No | Optional evidence supporting the visual style extraction. |

### Nested object: `LayerInfo`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `layerId` | string | No | Canonical identifier for this visual layer. When omitted, a deterministic identifier can be generated. |
| `markType` | string | Yes | Mark type, e.g., point, line, bar, area, node, edge, text. |
| `encoding` | LayerEncoding | Yes | Encodings on different channels for this layer. |

### Nested object: `LayerEncoding`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `x` | list of EncodingInfo | No | List of data fields encoded on the x channel (if any). |
| `y` | list of EncodingInfo | No | List of data fields encoded on the y channel (if any). |
| `color` | list of EncodingInfo | No | List of data fields encoded on the color channel (if any). |
| `size` | list of EncodingInfo | No | List of data fields encoded on the size channel (if any). |
| `shape` | list of EncodingInfo | No | List of data fields encoded on the shape channel (if any). |
| `opacity` | list of EncodingInfo | No | List of data fields encoded on the opacity channel (if any). |
| `text` | list of EncodingInfo | No | List of data fields encoded as textual labels or annotations (if any). |
| `row` | list of EncodingInfo | No | List of data fields encoded through row faceting or small multiples (if any). |
| `column` | list of EncodingInfo | No | List of data fields encoded through column faceting or small multiples (if any). |
| `latitude` | list of EncodingInfo | No | List of data fields encoded on map latitude or vertical geo position (if any). |
| `longitude` | list of EncodingInfo | No | List of data fields encoded on map longitude or horizontal geo position (if any). |
| `source` | list of EncodingInfo | No | List of data fields bound to edge/link sources in graph-like views (if any). |
| `target` | list of EncodingInfo | No | List of data fields bound to edge/link targets in graph-like views (if any). |

### Nested object: `EncodingInfo`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `field` | string | Yes | Data field name as used in the system (e.g., 'time', 'country'). |
| `type` | string | Yes | Data type or role of the field in the visualization, e.g., quantitative, ordinal, nominal, key, identifier, derived attribute, etc. |
| `description` | string | Yes | Textual description of how this field is encoded or interpreted. |

### Nested object: `NonVisualViewSpec`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `viewKind` | enum / string | Yes | High-level kind of this non-visual view. Must be one of the predefined ViewKind values (e.g., Chatbox, StructuredText, Control, DataPreview, Navigation, Inspector, Form, DashboardContainer) or others(<description>). |
| `subKind` | enum / string | No | Optional finer-grained subtype under the chosen viewKind, used to capture form factors such as Card/MindMap/Markdown for structured text, Slider/Dropdown for controls, or Image/Table/JSON for previews. |
| `description` | string | Yes | Textual description of the non-visual view, including its purpose, what content it shows, and how users interact with it. |
| `evidence` | EvidenceReference | No | Optional evidence supporting the non-visual view extraction. |

### Nested object: `ViewCoordinationInfo`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `coordinationId` | string | No | Canonical identifier for this coordination relationship. When omitted, a deterministic identifier can be generated. |
| `source` | ViewRef | Yes | Canonical source view/sub-view that triggers the interaction. |
| `sourceCapabilityRef` | CapabilityRef | No | Preferred reference to the user-visible capability on the source sub-view that triggers this coordination. |
| `targets` | list of ViewRef | Yes | Canonical target view/sub-view nodes that receive the effect. |
| `targetCapabilityRefs` | list of CapabilityRef | No | Preferred references to the user-visible capabilities on target sub-views that are updated or activated by this coordination. |
| `coordinationType` | enum | Yes | Canonical coordination mechanism describing how state or user-visible effects propagate between the source and target interface units. |
| `evidence` | EvidenceReference | Yes | Evidence supporting the coordination relationship as a whole. |

### Nested object: `ViewRef`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `viewId` | string | Yes | Canonical identifier of the parent view. |
| `subViewId` | string | No | Canonical identifier of the sub-view when the reference points below view level. |

### Nested object: `CapabilityRef`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `viewId` | string | Yes | Canonical identifier of the parent view. |
| `subViewId` | string | Yes | Canonical identifier of the parent sub-view. |
| `capabilityId` | string | Yes | Canonical identifier of the referenced capability. |

### Nested object: `EvidenceReference`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `passageIds` | list of integer | No | Ordered passage identifiers that support this extraction, if tracked. |
| `figureRefs` | list of string | No | Figure references such as 'Fig. 1a' or local image file names. |
| `quotes` | list of string | No | Short supporting quotes or evidence snippets. |
| `reasoning` | string | No | Brief explanation of how the evidence supports the structured item. |
| `confidence` | number | No | Optional confidence score for the extracted item. |

## 2. Intended Workflow

### Top-level object: `PaperWorkflowSpec`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `paperName` | string | Yes | Short paper identifier used in the project. |
| `systemName` | string | No | Name of the system discussed in the paper. |
| `systemSpecPath` | string | No | Relative path to the corresponding system specification file, if available. |
| `workflows` | list of WorkflowSpec | Yes | Author-intended workflows described in the paper. |
| `paperLevelClaims` | list of WorkflowClaim | No | Higher-level claims about intended usage that apply across workflows. |
| `evidence` | EvidenceReference | No | Evidence supporting the workflow extraction at paper level. |

### Nested object: `WorkflowSpec`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `workflowId` | string | No | Stable identifier of the intended workflow. |
| `workflowTitle` | string | No | Title or name of the intended workflow. |
| `workflowKind` | enum / string | No | High-level type of intended workflow. |
| `workflowGoal` | string | Yes | Main goal of the intended workflow. |
| `description` | string | No | Free-text summary of the intended end-to-end activity. |
| `applicabilityContext` | string | No | Task, data, starting point, actor, or scenario conditions under which this workflow applies. This is especially useful when a paper defines multiple workflows. |
| `targetUsers` | list of string | No | Target user group(s) for this intended workflow when stated in the paper. |
| `stages` | list of WorkflowStage | Yes | Ordered stages of the intended workflow. |
| `transitions` | list of WorkflowTransition | No | Explicit or inferred transitions between workflow stages. |
| `expectedFinalOutcome` | string | No | Expected final outcome if the workflow completes successfully. |
| `evidence` | EvidenceReference | No | Evidence supporting the workflow as a whole. |
| `inferenceType` | enum / string | No | Whether the workflow is explicitly described or synthesized. |

### Nested object: `WorkflowStage`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `stageId` | string | No | Stable identifier of the workflow stage. |
| `displayOrder` | integer | No | 1-based presentation order of the stage within the workflow. This does not establish a graph edge or require linear execution. |
| `stageTitle` | string | No | Short title of the intended stage when the paper names it explicitly. |
| `localGoal` | string | Yes | Why the intended process enters this stage. |
| `activitySummary` | string | No | What the user is intended to do during this stage. |
| `usedSubViews` | list of ViewRef | No | Canonical leaf sub-views expected to be used during this stage. Each reference must include subViewId. |
| `usedCapabilities` | list of CapabilityRef | No | Subview capabilities expected to be used in this stage. These capture intended usage of subview-internal functions. |
| `usedCoordinations` | list of WorkflowCoordinationRef | No | Coordinations the stage is expected to rely on. These capture intended cross-view behavior beyond individual subviews. |
| `expectedOutcome` | string | No | Expected result or decision support outcome of the stage. |
| `evidence` | EvidenceReference | No | Evidence supporting this intended stage. |
| `inferenceType` | enum / string | No | Whether the stage is directly stated or inferred from the paper. |

### Nested object: `WorkflowTransition`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `sourceStageId` | string | Yes | Source stage identifier. |
| `targetStageId` | string | Yes | Target stage identifier. |
| `rationale` | string | No | Why the workflow is expected to move from the source stage to the target stage. |
| `evidence` | EvidenceReference | Yes | Evidence establishing this directed stage-to-stage relation. |
| `inferenceType` | enum / string | Yes | Whether the transition is explicit or inferred. |

### Nested object: `WorkflowCoordinationRef`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `coordinationId` | string | Yes | Canonical coordination identifier from the system specification. |
| `description` | string | No | Optional short note about how the referencing schema uses this coordination. |

### Nested object: `WorkflowClaim`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `claimText` | string | Yes | High-level author claim about how the system is intended to be used. |
| `evidence` | EvidenceReference | No | Evidence supporting the workflow-level claim. |
| `inferenceType` | enum / string | No | Whether the claim is directly stated or inferred. |

## 3. Documented Case

### Top-level object: `PaperUsageSpec`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `paperName` | string | No | Paper title. |
| `systemName` | string | No | System name, if available. |
| `systemSpecPath` | string | No | Path to the linked system specification artifact when available. |
| `caseStudies` | list of CaseStudySpec | Yes | All extracted case studies in this paper. |
| `paperLevelUsageClaims` | list of string | No | Optional paper-level claims about how the system supports usage. |
| `evidence` | EvidenceReference | No | Paper-level evidence when needed. |
| `inferenceType` | enum / string | No | Whether paper-level usage claims are explicit or inferred. |

### Nested object: `CaseStudySpec`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `caseId` | string | No | Stable case identifier. |
| `caseTitle` | string | No | Case study title or label. |
| `caseStudyKind` | enum / string | No | Type of case study. |
| `analyst` | AnalystProfile | No | Analyst/user profile for the case. |
| `scenario` | ScenarioContext | Yes | Problem context and overall goal. |
| `questions` | list of QuestionItem | No | Canonical question inventory for the case. |
| `hypotheses` | list of HypothesisItem | No | Canonical hypothesis inventory for the case. |
| `episodes` | list of UsageEpisode | Yes | Ordered documented-use segments reconstructed independently of Intended Workflow stages. |
| `finalOutcome` | CaseOutcome | No | Final findings and decisions from the case. |
| `overallStrategySummary` | string | No | High-level summary of the end-to-end strategy. |
| `caseNarrativeSummary` | string | No | Compact prose summary of the full case. |
| `evidence` | EvidenceReference | No | Evidence for the case as a whole. |
| `inferenceType` | enum / string | No | Whether the case segmentation is explicit or inferred. |

### Nested object: `AnalystProfile`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `role` | enum / string | No | Role of the analyst/user in this case study. |
| `domainExpertise` | enum / string | No | Domain expertise level of the user. |
| `toolExpertise` | enum / string | No | Experience level with the VA system or similar tools. |
| `description` | string | No | Free-text characterization of the actor. |

### Nested object: `ScenarioContext`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `domainProblem` | string | Yes | Problem context in the domain. |
| `analysisGoal` | string | Yes | Main goal of the case study analysis. |
| `datasetContext` | string | No | Short description of the dataset involved. |
| `stakes` | string | No | Why this analysis matters in the application context. |
| `primaryQuestionId` | string | No | Reference to the canonical primary question; question text is stored only in questions[]. |

### Nested object: `QuestionItem`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `questionId` | string | No | Stable identifier of the question. |
| `questionText` | string | Yes | Canonical question phrasing. |
| `status` | enum / string | No | Reported question status; absence is not defaulted to Open. |
| `description` | string | No | Optional elaboration of the question. |
| `evidence` | EvidenceReference | No | Evidence for extracting this question. |
| `inferenceType` | enum / string | No | Whether this question is explicit or inferred. |

### Nested object: `HypothesisItem`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `hypothesisId` | string | No | Stable identifier of the hypothesis. |
| `hypothesisText` | string | Yes | Canonical hypothesis statement. |
| `status` | enum / string | No | Reported hypothesis status; absence is not defaulted to Proposed. |
| `relatedQuestionIds` | list of string | No | Question IDs that this hypothesis addresses. |
| `description` | string | No | Optional elaboration or scope of the hypothesis. |
| `evidence` | EvidenceReference | No | Evidence for extracting this hypothesis. |
| `inferenceType` | enum / string | No | Whether this hypothesis is explicit or inferred. |

### Nested object: `UsageEpisode`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `episodeId` | string | No | Stable episode identifier. |
| `narrativeOrder` | integer | No | Reported or reconstructed order of the episode within its case. |
| `episodeTitle` | string | No | Human-readable label for the episode. |
| `localGoal` | string | Yes | Dominant local analytic goal of this documented-use segment. Intended Workflow segmentation does not determine this boundary. |
| `focusQuestionIds` | list of string | No | Questions that dominate this episode. |
| `strategyText` | string | No | Free-text summary of the episode strategy. |
| `steps` | list of UsageStep | Yes | Ordered evidence-supported analytic moves in this episode. |
| `episodeOutcome` | string | No | What the episode achieved overall. |
| `evidence` | EvidenceReference | No | Evidence supporting the episode segmentation as a distinct local phase. |
| `inferenceType` | enum / string | No | Whether this episode boundary is explicit or inferred. |

### Nested object: `UsageStep`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `stepId` | string | No | Stable step identifier. |
| `stepOrder` | integer | No | Reported or reconstructed order of the step within its episode. |
| `narrativeSummary` | string | No | Conservative source-facing summary of the analytic move. This is not a normalized intent, operation, or strategy label. |
| `questionsAddressed` | list of string | No | Questions directly addressed in this step. |
| `hypothesesTouched` | list of string | No | Hypotheses touched in this step. |
| `intentText` | string | No | Source-facing statement of the immediate intent. |
| `operationText` | string | No | Source-facing description of what was done. |
| `usedSubViews` | list of ViewRef | No | Canonical sub-views directly supported by the source as used in this step. Parent-view-only references are not accepted. |
| `usedCapabilities` | list of CapabilityRef | No | Subview capabilities used in this step. These capture what the analyst directly did in a sub-view or what the analyst directly read from it. |
| `targetDataDescription` | list of string | No | Data subsets/entities under action in this step. |
| `observations` | list of ObservationItem | No | Observations produced in this step. |
| `producedInsights` | list of InsightItem | No | Insights or intermediate results produced by this step. |
| `decision` | DecisionItem | No | Decision made at the end of the step. |
| `documentedOutcome` | string | No | Source-facing result documented for this step. |
| `inferenceType` | enum / string | No | How directly this step is supported by the source narrative. |
| `sourceEvidence` | EvidenceReference | No | Evidence for the whole step. |

### Nested object: `ObservationItem`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `description` | string | Yes | What the analyst noticed. |
| `basedOnViews` | list of ViewRef | No | Views that directly support the observation. |
| `targetDataDescription` | list of string | No | Data subset or objects involved in the observation. |
| `evidence` | EvidenceReference | No | Evidence for this observation item. |
| `inferenceType` | enum / string | No | Whether the observation is explicit or inferred. |

### Nested object: `InsightItem`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `description` | string | Yes | Source-facing statement of the interpretation or understanding formed. |
| `relatedQuestionIds` | list of string | No | Questions answered or affected by this insight. |
| `relatedHypothesisIds` | list of string | No | Hypotheses addressed by this insight. |
| `supportedByViews` | list of ViewRef | No | Views supporting the insight. |
| `evidence` | EvidenceReference | No | Evidence for this insight. |
| `inferenceType` | enum / string | No | Whether the insight is explicit or inferred. |

### Nested object: `DecisionItem`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `description` | string | Yes | Decision or next analytic commitment made at this point. |
| `rationale` | string | No | Why this decision was made. |
| `targetQuestionIds` | list of string | No | Questions impacted by the decision. |
| `evidence` | EvidenceReference | No | Evidence for the decision. |
| `inferenceType` | enum / string | No | Whether the decision is explicit or inferred. |

### Nested object: `CaseOutcome`

| Field | Type | Required | Meaning |
|---|---|---|---|
| `finalInsights` | list of InsightItem | No | Final findings produced by the case study. |
| `finalDecisions` | list of DecisionItem | No | Final decisions or next actions. |
| `unresolvedQuestionIds` | list of string | No | Questions left open after the case. |
| `claimedSystemValue` | string | No | How the paper claims the system helped in this case. |
| `evidence` | EvidenceReference | No | Evidence for the case-level outcome summary. |
| `inferenceType` | enum / string | No | Whether this outcome is explicit or inferred. |
