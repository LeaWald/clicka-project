import { Meta, StoryObj } from '@storybook/react-webpack5';
import { SelectField } from './Select';
import { useForm, FormProvider } from 'react-hook-form';

const meta: Meta<typeof SelectField> = {
  title: 'BaseComponents/Select',
  component: SelectField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'selectOption',
    label: 'Select an Option',
    required: true,
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
  },
  render: (args) => {
    const methods = useForm();
    return (
      <FormProvider {...methods}> {/* מקיף את הקומפוננטה ב-FormProvider */}
        {/* <SelectField {...args} /> שולח את ה-args ל-SelectField */}
      </FormProvider>
    );
  },
};
