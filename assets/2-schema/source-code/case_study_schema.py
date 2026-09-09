from __future__ import annotations

from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator, model_validator

from shared.schemas.schema_common import (
    CapabilityRef,
    EvidenceReference,
    IdentifierString,
    OthersString,
    ViewRef,
    _dedupe_strings,
    _make_unique_identifier,
    _slugify_identifier,
)


# =========================================================
# 1. Taxonomies
# =========================================================

CaseStudyKind = Union[
    Literal[
        "RealWorldCase",
        "ExpertWalkthrough",
        "ScenarioDemonstration",
        "RetrospectiveAnalysis",
        "LongitudinalUse",
    ],
    OthersString,
]

ActorRole = Union[
    Literal[
        "DomainExpert",
        "DataAnalyst",
        "DecisionMaker",
        "Researcher",
        "Operator",
        "Investigator",
        "Clinician",
        "Engineer",
        "Student",
        "AuthorSimulatedUser",
    ],
    OthersString,
]

ExpertiseLevel = Union[
    Literal[
        "Novice",
        "Intermediate",
        "Expert",
        "Unknown",
    ],
    OthersString,
]

QuestionStatus = Union[
    Literal[
        "Open",
        "PartiallyAnswered",
        "Answered",
        "Abandoned",
    ],
    OthersString,
]

HypothesisStatus = Union[
    Literal[
        "Proposed",
        "UnderInvestigation",
        "Supported",
        "Rejected",
        "Revised",
        "Deferred",
    ],
    OthersString,
]

InferenceType = Union[
    Literal[
        "Explicit",
        "WeakInference",
        "StrongInference",
        "FigureGroundedInference",
        "CrossModalSynthesis",
    ],
    OthersString,
]


# =========================================================
# 2. Scenario / actor / question / hypothesis
# =========================================================


class AnalystProfile(BaseModel):
    role: Optional[ActorRole] = Field(
        default=None,
        description="Role of the analyst/user in this case study.",
    )
    domainExpertise: Optional[ExpertiseLevel] = Field(
        default=None,
        description="Domain expertise level of the user.",
    )
    toolExpertise: Optional[ExpertiseLevel] = Field(
        default=None,
        description="Experience level with the VA system or similar tools.",
    )
    description: Optional[str] = Field(
        default=None,
        description="Free-text characterization of the actor.",
    )


class ScenarioContext(BaseModel):
    domainProblem: str = Field(
        ...,
        description="Problem context in the domain.",
    )
    analysisGoal: str = Field(
        ...,
        description="Main goal of the case study analysis.",
    )
    datasetContext: Optional[str] = Field(
        default=None,
        description="Short description of the dataset involved.",
    )
    stakes: Optional[str] = Field(
        default=None,
        description="Why this analysis matters in the application context.",
    )
    primaryQuestionId: Optional[IdentifierString] = Field(
        default=None,
        description="Reference to the canonical primary question; question text is stored only in questions[].",
    )


class QuestionItem(BaseModel):
    questionId: Optional[IdentifierString] = Field(
        default=None,
        description="Stable identifier of the question.",
    )
    questionText: str = Field(
        ...,
        description="Canonical question phrasing.",
    )
    status: Optional[QuestionStatus] = Field(
        default=None,
        description="Reported question status; absence is not defaulted to Open.",
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional elaboration of the question.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for extracting this question.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether this question is explicit or inferred.",
    )


class HypothesisItem(BaseModel):
    hypothesisId: Optional[IdentifierString] = Field(
        default=None,
        description="Stable identifier of the hypothesis.",
    )
    hypothesisText: str = Field(
        ...,
        description="Canonical hypothesis statement.",
    )
    status: Optional[HypothesisStatus] = Field(
        default=None,
        description="Reported hypothesis status; absence is not defaulted to Proposed.",
    )
    relatedQuestionIds: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Question IDs that this hypothesis addresses.",
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional elaboration or scope of the hypothesis.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for extracting this hypothesis.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether this hypothesis is explicit or inferred.",
    )

    @field_validator("relatedQuestionIds", mode="before")
    @classmethod
    def normalize_related_question_ids(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        self.relatedQuestionIds = _dedupe_strings(self.relatedQuestionIds)
        return self


# =========================================================
# 3. Observation / insight / decision
# =========================================================


class ObservationItem(BaseModel):
    description: str = Field(
        ...,
        description="What the analyst noticed.",
    )
    basedOnViews: Optional[List[ViewRef]] = Field(
        default=None,
        description="Views that directly support the observation.",
    )
    targetDataDescription: Optional[List[str]] = Field(
        default=None,
        description="Data subset or objects involved in the observation.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for this observation item.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether the observation is explicit or inferred.",
    )

    @field_validator("targetDataDescription", mode="before")
    @classmethod
    def normalize_target_data(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        self.targetDataDescription = _dedupe_strings(self.targetDataDescription)
        if self.basedOnViews:
            seen: set[tuple[str, Optional[str]]] = set()
            deduped: List[ViewRef] = []
            for ref in self.basedOnViews:
                key = (ref.viewId, ref.subViewId)
                if key in seen:
                    continue
                seen.add(key)
                deduped.append(ref)
            self.basedOnViews = deduped
        return self


class InsightItem(BaseModel):
    description: str = Field(
        ...,
        description="Source-facing statement of the interpretation or understanding formed.",
    )
    relatedQuestionIds: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Questions answered or affected by this insight.",
    )
    relatedHypothesisIds: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Hypotheses addressed by this insight.",
    )
    supportedByViews: Optional[List[ViewRef]] = Field(
        default=None,
        description="Views supporting the insight.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for this insight.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether the insight is explicit or inferred.",
    )

    @field_validator("relatedQuestionIds", "relatedHypothesisIds", mode="before")
    @classmethod
    def normalize_related_ids(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        self.relatedQuestionIds = _dedupe_strings(self.relatedQuestionIds)
        self.relatedHypothesisIds = _dedupe_strings(self.relatedHypothesisIds)
        if self.supportedByViews:
            seen: set[tuple[str, Optional[str]]] = set()
            deduped: List[ViewRef] = []
            for ref in self.supportedByViews:
                key = (ref.viewId, ref.subViewId)
                if key in seen:
                    continue
                seen.add(key)
                deduped.append(ref)
            self.supportedByViews = deduped
        return self


class DecisionItem(BaseModel):
    description: str = Field(
        ...,
        description="Decision or next analytic commitment made at this point.",
    )
    rationale: Optional[str] = Field(
        default=None,
        description="Why this decision was made.",
    )
    targetQuestionIds: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Questions impacted by the decision.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for the decision.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether the decision is explicit or inferred.",
    )

    @field_validator("targetQuestionIds", mode="before")
    @classmethod
    def normalize_target_question_ids(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        self.targetQuestionIds = _dedupe_strings(self.targetQuestionIds)
        return self


# =========================================================
# 4. Usage step / episode
# =========================================================


class UsageStep(BaseModel):
    """Smallest evidence-supported analytic move inside an episode."""

    stepId: Optional[IdentifierString] = Field(
        default=None,
        description="Stable step identifier.",
    )
    stepOrder: Optional[int] = Field(
        default=None,
        ge=1,
        description="Reported or reconstructed order of the step within its episode.",
    )
    narrativeSummary: Optional[str] = Field(
        default=None,
        description=(
            "Conservative source-facing summary of the analytic move. This is not a normalized intent, "
            "operation, or strategy label."
        ),
    )
    questionsAddressed: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Questions directly addressed in this step.",
    )
    hypothesesTouched: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Hypotheses touched in this step.",
    )
    intentText: Optional[str] = Field(
        default=None,
        description="Source-facing statement of the immediate intent.",
    )
    operationText: Optional[str] = Field(
        default=None,
        description="Source-facing description of what was done.",
    )
    usedSubViews: Optional[List[ViewRef]] = Field(
        default=None,
        description=(
            "Canonical sub-views directly supported by the source as used in this step. Parent-view-only "
            "references are not accepted."
        ),
    )
    usedCapabilities: Optional[List[CapabilityRef]] = Field(
        default=None,
        description=(
            "Subview capabilities used in this step. These capture what the analyst directly did in a "
            "sub-view or what the analyst directly read from it."
        ),
    )
    targetDataDescription: Optional[List[str]] = Field(
        default=None,
        description="Data subsets/entities under action in this step.",
    )
    observations: Optional[List[ObservationItem]] = Field(
        default=None,
        description="Observations produced in this step.",
    )
    producedInsights: Optional[List[InsightItem]] = Field(
        default=None,
        description="Insights or intermediate results produced by this step.",
    )
    decision: Optional[DecisionItem] = Field(
        default=None,
        description="Decision made at the end of the step.",
    )
    documentedOutcome: Optional[str] = Field(
        default=None,
        description="Source-facing result documented for this step.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="How directly this step is supported by the source narrative.",
    )
    sourceEvidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for the whole step.",
    )
    @field_validator(
        "questionsAddressed",
        "hypothesesTouched",
        "targetDataDescription",
        mode="before",
    )
    @classmethod
    def normalize_string_list_fields(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        self.questionsAddressed = _dedupe_strings(self.questionsAddressed)
        self.hypothesesTouched = _dedupe_strings(self.hypothesesTouched)
        self.targetDataDescription = _dedupe_strings(self.targetDataDescription)

        if self.usedSubViews:
            seen: set[tuple[str, str]] = set()
            deduped: List[ViewRef] = []
            for ref in self.usedSubViews:
                if ref.subViewId is None:
                    raise ValueError("usedSubViews entries require subViewId.")
                key = (ref.viewId, ref.subViewId)
                if key in seen:
                    continue
                seen.add(key)
                deduped.append(ref)
            self.usedSubViews = deduped

        if self.usedCapabilities:
            seen_capabilities: set[tuple[str, str, str]] = set()
            deduped_capabilities: List[CapabilityRef] = []
            for ref in self.usedCapabilities:
                key = (ref.viewId, ref.subViewId, ref.capabilityId)
                if key in seen_capabilities:
                    continue
                seen_capabilities.add(key)
                deduped_capabilities.append(ref)
            self.usedCapabilities = deduped_capabilities

        if self.narrativeSummary is None and self.sourceEvidence is None:
            raise ValueError("UsageStep requires narrativeSummary or sourceEvidence.")

        return self


class UsageEpisode(BaseModel):
    """Continuous documented-use segment organized around one dominant local goal."""

    episodeId: Optional[IdentifierString] = Field(
        default=None,
        description="Stable episode identifier.",
    )
    narrativeOrder: Optional[int] = Field(
        default=None,
        ge=1,
        description="Reported or reconstructed order of the episode within its case.",
    )
    episodeTitle: Optional[str] = Field(
        default=None,
        description="Human-readable label for the episode.",
    )
    localGoal: str = Field(
        ...,
        description=(
            "Dominant local analytic goal of this documented-use segment. Intended Workflow segmentation "
            "does not determine this boundary."
        ),
    )
    focusQuestionIds: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Questions that dominate this episode.",
    )
    strategyText: Optional[str] = Field(
        default=None,
        description="Free-text summary of the episode strategy.",
    )
    steps: List[UsageStep] = Field(
        ...,
        description=(
            "Ordered evidence-supported analytic moves in this episode."
        ),
    )
    episodeOutcome: Optional[str] = Field(
        default=None,
        description="What the episode achieved overall.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence supporting the episode segmentation as a distinct local phase.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether this episode boundary is explicit or inferred.",
    )

    @field_validator("focusQuestionIds", mode="before")
    @classmethod
    def normalize_focus_question_ids(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        self.focusQuestionIds = _dedupe_strings(self.focusQuestionIds)
        if not self.steps:
            raise ValueError("UsageEpisode must contain at least one UsageStep.")
        return self


# =========================================================
# 5. Case-level outcome
# =========================================================


class CaseOutcome(BaseModel):
    finalInsights: Optional[List[InsightItem]] = Field(
        default=None,
        description="Final findings produced by the case study.",
    )
    finalDecisions: Optional[List[DecisionItem]] = Field(
        default=None,
        description="Final decisions or next actions.",
    )
    unresolvedQuestionIds: Optional[List[IdentifierString]] = Field(
        default=None,
        description="Questions left open after the case.",
    )
    claimedSystemValue: Optional[str] = Field(
        default=None,
        description="How the paper claims the system helped in this case.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for the case-level outcome summary.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether this outcome is explicit or inferred.",
    )

    @field_validator("unresolvedQuestionIds", mode="before")
    @classmethod
    def normalize_unresolved_ids(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        self.unresolvedQuestionIds = _dedupe_strings(self.unresolvedQuestionIds)
        return self


# =========================================================
# 6. Top-level case study schema
# =========================================================


class CaseStudySpec(BaseModel):
    caseId: Optional[IdentifierString] = Field(
        default=None,
        description="Stable case identifier.",
    )
    caseTitle: Optional[str] = Field(
        default=None,
        description="Case study title or label.",
    )
    caseStudyKind: Optional[CaseStudyKind] = Field(
        default=None,
        description="Type of case study.",
    )
    analyst: Optional[AnalystProfile] = Field(
        default=None,
        description="Analyst/user profile for the case.",
    )
    scenario: ScenarioContext = Field(
        ...,
        description="Problem context and overall goal.",
    )
    questions: Optional[List[QuestionItem]] = Field(
        default=None,
        description="Canonical question inventory for the case.",
    )
    hypotheses: Optional[List[HypothesisItem]] = Field(
        default=None,
        description="Canonical hypothesis inventory for the case.",
    )
    episodes: List[UsageEpisode] = Field(
        ...,
        description=(
            "Ordered documented-use segments reconstructed independently of Intended Workflow stages."
        ),
    )
    finalOutcome: Optional[CaseOutcome] = Field(
        default=None,
        description="Final findings and decisions from the case.",
    )
    overallStrategySummary: Optional[str] = Field(
        default=None,
        description="High-level summary of the end-to-end strategy.",
    )
    caseNarrativeSummary: Optional[str] = Field(
        default=None,
        description="Compact prose summary of the full case.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Evidence for the case as a whole.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether the case segmentation is explicit or inferred.",
    )

    @model_validator(mode="after")
    def populate_ids_and_validate(self):
        if not self.episodes:
            raise ValueError("CaseStudySpec requires at least one UsageEpisode.")

        case_fallback = "case-1"
        self.caseId = self.caseId or _slugify_identifier(self.caseTitle, case_fallback)

        question_items = list(self.questions or [])
        hypothesis_items = list(self.hypotheses or [])

        valid_question_ids: set[str] = set()
        valid_hypothesis_ids: set[str] = set()

        seen_q_ids: set[str] = set()
        for item in question_items:
            if item.questionId is None:
                continue
            if item.questionId in seen_q_ids:
                raise ValueError(f"Duplicate persisted questionId '{item.questionId}'.")
            seen_q_ids.add(item.questionId)

        for idx, item in enumerate(question_items, start=1):
            if item.questionId is None:
                item.questionId = _make_unique_identifier(
                    f"{self.caseId}.question-{idx}",
                    seen_q_ids,
                )
            valid_question_ids.add(item.questionId)

        seen_h_ids: set[str] = set()
        for item in hypothesis_items:
            if item.hypothesisId is None:
                continue
            if item.hypothesisId in seen_h_ids:
                raise ValueError(f"Duplicate persisted hypothesisId '{item.hypothesisId}'.")
            seen_h_ids.add(item.hypothesisId)

        for idx, item in enumerate(hypothesis_items, start=1):
            if item.hypothesisId is None:
                item.hypothesisId = _make_unique_identifier(
                    f"{self.caseId}.hypothesis-{idx}",
                    seen_h_ids,
                )
            valid_hypothesis_ids.add(item.hypothesisId)

        seen_episode_ids: set[str] = set()
        seen_step_ids_global: set[str] = set()

        for episode in self.episodes:
            if episode.episodeId is None:
                continue
            if episode.episodeId in seen_episode_ids:
                raise ValueError(f"Duplicate persisted episodeId '{episode.episodeId}'.")
            seen_episode_ids.add(episode.episodeId)

        for episode in self.episodes:
            for step in episode.steps:
                if step.stepId is None:
                    continue
                if step.stepId in seen_step_ids_global:
                    raise ValueError(f"Duplicate persisted stepId '{step.stepId}'.")
                seen_step_ids_global.add(step.stepId)

        for eidx, episode in enumerate(self.episodes, start=1):
            if episode.episodeId is None:
                episode.episodeId = _make_unique_identifier(
                    f"{self.caseId}.episode-{eidx}",
                    seen_episode_ids,
                )
            if episode.narrativeOrder is None:
                episode.narrativeOrder = eidx

            for sidx, step in enumerate(episode.steps, start=1):
                if step.stepId is None:
                    step.stepId = _make_unique_identifier(
                        f"{episode.episodeId}.step-{sidx}",
                        seen_step_ids_global,
                    )
                if step.stepOrder is None:
                    step.stepOrder = sidx

        self.questions = question_items or None
        self.hypotheses = hypothesis_items or None

        def validate_question_refs(values: Optional[List[str]], label: str):
            for qid in values or []:
                if qid not in valid_question_ids:
                    raise ValueError(f"{label} references unknown questionId '{qid}'.")

        def validate_hypothesis_refs(values: Optional[List[str]], label: str):
            for hid in values or []:
                if hid not in valid_hypothesis_ids:
                    raise ValueError(f"{label} references unknown hypothesisId '{hid}'.")

        if self.scenario.primaryQuestionId is not None:
            validate_question_refs(
                [self.scenario.primaryQuestionId],
                "Scenario primaryQuestionId",
            )

        for item in self.hypotheses or []:
            validate_question_refs(item.relatedQuestionIds, f"Hypothesis '{item.hypothesisId}' relatedQuestionIds")

        narrative_orders = [episode.narrativeOrder for episode in self.episodes]
        expected_episode_orders = list(range(1, len(self.episodes) + 1))
        if narrative_orders != expected_episode_orders:
            raise ValueError("UsageEpisode narrativeOrder values must match list order 1..n.")

        for episode in self.episodes:
            step_orders = [step.stepOrder for step in episode.steps]
            expected_step_orders = list(range(1, len(episode.steps) + 1))
            if step_orders != expected_step_orders:
                raise ValueError(
                    f"Episode '{episode.episodeId}' stepOrder values must match list order 1..n."
                )

            validate_question_refs(episode.focusQuestionIds, f"Episode '{episode.episodeId}' focusQuestionIds")

            for step in episode.steps:
                validate_question_refs(step.questionsAddressed, f"Step '{step.stepId}' questionsAddressed")
                validate_hypothesis_refs(step.hypothesesTouched, f"Step '{step.stepId}' hypothesesTouched")

                for insight in step.producedInsights or []:
                    validate_question_refs(
                        insight.relatedQuestionIds,
                        f"Step '{step.stepId}' producedInsight.relatedQuestionIds",
                    )
                    validate_hypothesis_refs(
                        insight.relatedHypothesisIds,
                        f"Step '{step.stepId}' producedInsight.relatedHypothesisIds",
                    )

                if step.decision:
                    validate_question_refs(
                        step.decision.targetQuestionIds,
                        f"Step '{step.stepId}' decision.targetQuestionIds",
                    )

        if self.finalOutcome:
            validate_question_refs(
                self.finalOutcome.unresolvedQuestionIds,
                f"Case '{self.caseId}' finalOutcome.unresolvedQuestionIds",
            )
            for insight in self.finalOutcome.finalInsights or []:
                validate_question_refs(
                    insight.relatedQuestionIds,
                    f"Case '{self.caseId}' finalInsight.relatedQuestionIds",
                )
                validate_hypothesis_refs(
                    insight.relatedHypothesisIds,
                    f"Case '{self.caseId}' finalInsight.relatedHypothesisIds",
                )
            for decision in self.finalOutcome.finalDecisions or []:
                validate_question_refs(
                    decision.targetQuestionIds,
                    f"Case '{self.caseId}' finalDecision.targetQuestionIds",
                )

        return self


# =========================================================
# 7. Paper-level wrapper
# =========================================================


class PaperUsageSpec(BaseModel):
    paperName: Optional[str] = Field(
        default=None,
        description="Paper title.",
    )
    systemName: Optional[str] = Field(
        default=None,
        description="System name, if available.",
    )
    systemSpecPath: Optional[str] = Field(
        default=None,
        description="Path to the linked system specification artifact when available.",
    )
    caseStudies: List[CaseStudySpec] = Field(
        ...,
        description="All extracted case studies in this paper.",
    )
    paperLevelUsageClaims: Optional[List[str]] = Field(
        default=None,
        description="Optional paper-level claims about how the system supports usage.",
    )
    evidence: Optional[EvidenceReference] = Field(
        default=None,
        description="Paper-level evidence when needed.",
    )
    inferenceType: Optional[InferenceType] = Field(
        default=None,
        description="Whether paper-level usage claims are explicit or inferred.",
    )

    @field_validator("paperLevelUsageClaims", mode="before")
    @classmethod
    def normalize_claims(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return [value]
        return value

    @model_validator(mode="after")
    def validate_payload(self):
        if not self.caseStudies:
            raise ValueError("PaperUsageSpec requires at least one CaseStudySpec.")

        self.paperLevelUsageClaims = _dedupe_strings(self.paperLevelUsageClaims)

        seen_case_ids: set[str] = set()
        for case in self.caseStudies:
            if case.caseId in seen_case_ids:
                raise ValueError(f"Duplicate persisted caseId '{case.caseId}'.")
            seen_case_ids.add(case.caseId)

        return self
