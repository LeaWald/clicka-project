import { Meta, StoryObj } from '@storybook/react-webpack5';
import { NumberInputField } from './InputNumber';
import { useForm, FormProvider } from 'react-hook-form';

const meta: Meta<typeof NumberInputField> = {
  title: 'BaseComponents/InputNumber',
  component: NumberInputField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'testNumber',
    label: 'Test Number Input',
    required: true,
    placeholder: 'Enter a number...',
    defaultValue: 5,
    min: 0,
    max: 100,
    step: 1,
  },
  render: (args) => {
    const methods = useForm(); // יצירת useForm
    return (
      <FormProvider {...methods}> {/* מקיף את הקומפוננטה ב-FormProvider */}
        {/* <NumberInputField {...args} /> שולח את ה-args ל-NumberInputField */}
      </FormProvider>
    );
  },
};