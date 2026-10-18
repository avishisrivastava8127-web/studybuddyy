export const SAMPLE_NOTES = `DBMS Unit 3: Normalization & Relational Database Design

1. What is Normalization?
Normalization is the systematic approach of decomposing tables to eliminate data redundancy (repetition) and undesirable anomalies (Insertion, Update, and Deletion anomalies). It was introduced by Edgar F. Codd.

2. Functional Dependencies (FD)
- A functional dependency X -> Y means that the value of attribute X uniquely determines the value of attribute Y.
- Trivial FD: If Y is a subset of X (e.g., AB -> A).
- Non-trivial FD: If Y is not a subset of X (e.g., RollNo -> StudentName).

3. Normal Forms
- First Normal Form (1NF):
  * Each attribute must contain only atomic (indivisible) values.
  * No repeating groups or multi-valued attributes allowed.
  * Every row must be unique (primary key exists).

- Second Normal Form (2NF):
  * Table must be in 1NF.
  * No partial dependency: No non-prime attribute should be functionally dependent on any proper subset of any candidate key.
  * In other words, non-key attributes must depend on the whole candidate key.

- Third Normal Form (3NF):
  * Table must be in 2NF.
  * No transitive dependency: No non-prime attribute should transitively depend on the primary key (X -> Y and Y -> Z where Z is non-prime).
  * For every non-trivial FD X -> Y: either X is a super key, or Y is a prime attribute.

- Boyce-Codd Normal Form (BCNF):
  * Stricter version of 3NF.
  * For every functional dependency X -> Y, X must strictly be a super key.

Key Terms:
- Redundancy: Unnecessary repetition of data across records.
- Insertion Anomaly: Inability to insert a record without inserting unrelated extra attributes.
- Deletion Anomaly: Unintended loss of important data when another record is deleted.
- Update Anomaly: Data inconsistency caused by updating data in some rows but missing others.`;
