// Credential Templates for quick issuance

export interface CredentialTemplate {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'select';
    required: boolean;
    options?: string[];
    placeholder?: string;
  }[];
  defaultClaims: Record<string, string>;
}

export const credentialTemplates: CredentialTemplate[] = [
  {
    id: 'university_degree',
    name: 'University Degree',
    type: 'UniversityDegree',
    icon: '🎓',
    description: 'Academic degree or diploma from a university',
    fields: [
      { key: 'degree', label: 'Degree Name', type: 'text', required: true, placeholder: 'BSc Computer Science' },
      { key: 'university', label: 'University Name', type: 'text', required: true, placeholder: 'Example University' },
      { key: 'graduationYear', label: 'Graduation Year', type: 'number', required: true, placeholder: '2024' },
      { key: 'gpa', label: 'GPA', type: 'text', required: false, placeholder: '3.8' },
      { key: 'honors', label: 'Honors', type: 'select', required: false, options: ['None', 'Cum Laude', 'Magna Cum Laude', 'Summa Cum Laude'] },
    ],
    defaultClaims: { degree: '', university: '', graduationYear: '', gpa: '', honors: '' },
  },
  {
    id: 'employment',
    name: 'Employment Certificate',
    type: 'EmploymentCredential',
    icon: '💼',
    description: 'Proof of employment at a company',
    fields: [
      { key: 'company', label: 'Company Name', type: 'text', required: true, placeholder: 'Acme Corp' },
      { key: 'position', label: 'Job Title', type: 'text', required: true, placeholder: 'Software Engineer' },
      { key: 'department', label: 'Department', type: 'text', required: false, placeholder: 'Engineering' },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true, placeholder: '' },
      { key: 'endDate', label: 'End Date (if applicable)', type: 'date', required: false, placeholder: '' },
      { key: 'employmentType', label: 'Employment Type', type: 'select', required: true, options: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
    ],
    defaultClaims: { company: '', position: '', department: '', startDate: '', endDate: '', employmentType: 'Full-time' },
  },
  {
    id: 'professional_license',
    name: 'Professional License',
    type: 'ProfessionalLicense',
    icon: '📜',
    description: 'Professional certification or license',
    fields: [
      { key: 'licenseName', label: 'License Name', type: 'text', required: true, placeholder: 'Certified Public Accountant' },
      { key: 'licenseNumber', label: 'License Number', type: 'text', required: true, placeholder: 'CPA-123456' },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: true, placeholder: 'State Board of Accountancy' },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true, placeholder: '' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: false, placeholder: '' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Inactive', 'Pending Renewal'] },
    ],
    defaultClaims: { licenseName: '', licenseNumber: '', issuingAuthority: '', issueDate: '', expiryDate: '', status: 'Active' },
  },
  {
    id: 'training_certificate',
    name: 'Training Certificate',
    type: 'TrainingCertificate',
    icon: '📚',
    description: 'Completion of a training program or course',
    fields: [
      { key: 'courseName', label: 'Course Name', type: 'text', required: true, placeholder: 'Advanced Web Development' },
      { key: 'provider', label: 'Training Provider', type: 'text', required: true, placeholder: 'Tech Academy' },
      { key: 'completionDate', label: 'Completion Date', type: 'date', required: true, placeholder: '' },
      { key: 'duration', label: 'Duration (hours)', type: 'number', required: false, placeholder: '40' },
      { key: 'score', label: 'Final Score/Grade', type: 'text', required: false, placeholder: '95%' },
    ],
    defaultClaims: { courseName: '', provider: '', completionDate: '', duration: '', score: '' },
  },
  {
    id: 'identity_verification',
    name: 'Identity Verification',
    type: 'IdentityCredential',
    icon: '🆔',
    description: 'KYC/Identity verification credential',
    fields: [
      { key: 'fullName', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, placeholder: '' },
      { key: 'nationality', label: 'Nationality', type: 'text', required: true, placeholder: 'United States' },
      { key: 'documentType', label: 'Document Type', type: 'select', required: true, options: ['Passport', 'National ID', 'Driver License'] },
      { key: 'documentNumber', label: 'Document Number', type: 'text', required: true, placeholder: 'XX1234567' },
      { key: 'verificationLevel', label: 'Verification Level', type: 'select', required: true, options: ['Basic', 'Standard', 'Enhanced'] },
    ],
    defaultClaims: { fullName: '', dateOfBirth: '', nationality: '', documentType: 'Passport', documentNumber: '', verificationLevel: 'Standard' },
  },
  {
    id: 'custom',
    name: 'Custom Credential',
    type: 'CustomCredential',
    icon: '✏️',
    description: 'Create a custom credential with your own fields',
    fields: [],
    defaultClaims: {},
  },
];

export function getTemplateById(id: string): CredentialTemplate | undefined {
  return credentialTemplates.find(t => t.id === id);
}
