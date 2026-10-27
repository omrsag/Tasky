type ActionFeedbackProps = {
    message: string;
    type: "success" | "danger";
};

const ActionFeedback = ({ message, type }: ActionFeedbackProps) => {
    return (
        <div className={`alert alert-${type}`} role="alert">
            {message}
        </div>
    );
};

export default ActionFeedback;
